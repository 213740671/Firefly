import { spawnSync } from "node:child_process";

function run(cmd, args, opts = {}) {
	const res = spawnSync(cmd, args, {
		stdio: "inherit",
		shell: false,
		...opts,
	});
	if (res.status !== 0) {
		throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
	}
}

function runCapture(cmd, args) {
	const res = spawnSync(cmd, args, {
		encoding: "utf8",
		shell: false,
	});
	if (res.status !== 0) {
		return "";
	}
	return (res.stdout || "").trim();
}

function parseArgs(argv) {
	const out = {
		message: "",
		noCheck: false,
		noBuild: false,
		noCommit: false,
		noPush: false,
		remote: "origin",
		branch: "",
		stage: "all",
	};

	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === "-m" || a === "--message") {
			out.message = argv[i + 1] ?? "";
			i++;
			continue;
		}
		if (a === "--no-check") {
			out.noCheck = true;
			continue;
		}
		if (a === "--no-build") {
			out.noBuild = true;
			continue;
		}
		if (a === "--no-commit") {
			out.noCommit = true;
			continue;
		}
		if (a === "--no-push") {
			out.noPush = true;
			continue;
		}
		if (a === "--remote") {
			out.remote = argv[i + 1] ?? "origin";
			i++;
			continue;
		}
		if (a === "--branch") {
			out.branch = argv[i + 1] ?? "";
			i++;
			continue;
		}
		if (a === "--content-only") {
			out.stage = "content";
		}
	}

	return out;
}

function getStatusPorcelain() {
	return runCapture("git", ["status", "--porcelain"]);
}

function ensureCleanSecrets(statusText) {
	const lines = statusText
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);

	const forbidden = [
		/^\.env(\..+)?$/i,
		/\bcredentials\b/i,
		/\bid_rsa\b/i,
		/\bsecret\b/i,
		/\btoken\b/i,
		/\.pem$/i,
		/\.key$/i,
	];

	for (const line of lines) {
		const parts = line.split(/\s+/).slice(1);
		const file = parts.join(" ");
		if (!file) continue;
		for (const re of forbidden) {
			if (re.test(file)) {
				throw new Error(
					`Refusing to commit possible secret file: ${file}. Remove it from changes or add to .gitignore.`,
				);
			}
		}
	}
}

function stageFiles(stageMode) {
	if (stageMode === "content") {
		run("git", ["add", "-A", "src/content"]);
		return;
	}
	run("git", ["add", "-A"]);
}

function getCurrentBranch() {
	return runCapture("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
}

function hasUpstream() {
	const upstream = runCapture("git", [
		"rev-parse",
		"--abbrev-ref",
		"--symbolic-full-name",
		"@{u}",
	]);
	return upstream.length > 0;
}

function defaultMessage() {
	const now = new Date();
	const yyyy = now.getFullYear();
	const mm = String(now.getMonth() + 1).padStart(2, "0");
	const dd = String(now.getDate()).padStart(2, "0");
	return `chore: sync blog updates (${yyyy}-${mm}-${dd})`;
}

async function main() {
	const args = parseArgs(process.argv.slice(2));

	const status0 = getStatusPorcelain();
	if (!status0) {
		console.log("No local changes to sync.");
		return;
	}
	ensureCleanSecrets(status0);

	if (!args.noCheck) {
		run("pnpm", ["check"]);
	}
	if (!args.noBuild) {
		run("pnpm", ["build"]);
	}

	stageFiles(args.stage);

	const status1 = getStatusPorcelain();
	if (!status1) {
		console.log("Nothing staged/changed after staging.");
		return;
	}

	if (!args.noCommit) {
		const msg = args.message?.trim() ? args.message.trim() : defaultMessage();
		run("git", ["commit", "-m", msg]);
	}

	if (args.noPush) {
		console.log("Skip push (--no-push). Done.");
		return;
	}

	const branch = args.branch?.trim() ? args.branch.trim() : getCurrentBranch();
	if (!branch) {
		throw new Error("Cannot determine current branch.");
	}

	if (hasUpstream()) {
		run("git", ["push"]);
		return;
	}

	run("git", ["push", "-u", args.remote, branch]);
}

main().catch((err) => {
	console.error(err instanceof Error ? err.message : err);
	process.exit(1);
});
