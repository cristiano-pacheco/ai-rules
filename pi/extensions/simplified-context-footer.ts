/**
 * Simplified Context Footer
 *
 * Replaces Pi's built-in footer with one that is visually identical except
 * for the context/token metrics section. The native footer shows:
 *
 *   ↑3 ↓13 W9.9k CH0.0% 0.9%/1.1M (auto)        model • thinking
 *
 * This extension shows only:
 *
 *   9.9K (0.9%) (auto)                            model • thinking
 *
 * Everything else — pwd, git branch, session name, model id, provider,
 * reasoning level, colors, dim styling, alignment,
 * responsive truncation, extension status lines — is preserved exactly
 * by reusing Pi's native footer implementation logic and helpers:
 *
 *   - `formatTokens` / `formatCwdForFooter` from the native footer module
 *   - the `theme` singleton (same globalThis-backed proxy Pi uses internally)
 *   - `truncateToWidth` / `visibleWidth` from @earendil-works/pi-tui
 *   - `areExperimentalFeaturesEnabled` from Pi core
 *   - `ctx.sessionManager`, `ctx.model`, `ctx.thinkingLevel`,
 *     `ctx.getContextUsage()` for live dynamic values
 *   - `footerData.getGitBranch()`, `getExtensionStatuses()`,
 *     `getAvailableProviderCount()`, `onBranchChange()` for the data Pi
 *     only exposes through the footer data provider
 *
 * No colors, spacing, or styling are hardcoded. All styling goes through
 * `theme.fg(...)`, exactly like the native footer.
 *
 * Implementation note: Pi's package.json restricts bare deep imports via
 * the `exports` field, so the deep modules (footer helpers, theme, experimental)
 * are loaded with dynamic `import()` using `file://` URLs resolved from
 * `getPackageDir()`. This resolves to the exact same modules Pi's own
 * FooterComponent uses, so formatting and colors stay in lockstep with Pi.
 */

import {
	getPackageDir,
	type ExtensionAPI,
} from "@earendil-works/pi-coding-agent";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

// --- Types for the reused native helpers ---
type Theme = {
	fg(color: string, text: string): string;
	bold(text: string): string;
};

type NativeFooterModule = {
	formatTokens(count: number): string;
	formatCwdForFooter(cwd: string, home: string | undefined): string;
};

// Shared module cache for the native helpers. Loaded once per session.
let nativeFooter: NativeFooterModule | undefined;
let themeSingleton: Theme | undefined;
let areExperimentalFeaturesEnabled: () => boolean | undefined;

async function loadNativeHelpers(pkgDir: string): Promise<void> {
	if (nativeFooter && themeSingleton && areExperimentalFeaturesEnabled) return;
	const toUrl = (rel: string) => pathToFileURL(join(pkgDir, rel)).href;
	const [footerMod, themeMod, expMod] = await Promise.all([
		import(toUrl("dist/modes/interactive/components/footer.js")),
		import(toUrl("dist/modes/interactive/theme/theme.js")),
		import(toUrl("dist/core/experimental.js")),
	]);
	nativeFooter = footerMod as NativeFooterModule;
	themeSingleton = themeMod.theme as Theme;
	areExperimentalFeaturesEnabled = expMod.areExperimentalFeaturesEnabled as () => boolean;
}

/**
 * Compact context-token formatting, matching the spec's examples:
 *
 *   999      (< 1,000)
 *   1.2K     (< 100K, one decimal in K)
 *   9.9K
 *   16.5K
 *   120K     (>= 100K, integer K)
 *   1.1M     (>= 1M, one decimal in M)
 *
 * Pi's native `formatTokens` lower-cases the unit (9.9k) and uses slightly
 * different boundaries; the spec requires upper-case units and the listed
 * precision rules, so a small dedicated formatter is used for the context
 * metric only. All other token formatting (if any were shown) would reuse
 * `formatTokens`.
 */
function formatContextTokens(count: number): string {
	if (count < 1000) return Math.round(count).toString();
	if (count < 100_000) return `${(count / 1000).toFixed(1)}K`;
	if (count < 1_000_000) return `${Math.round(count / 1000)}K`;
	return `${(count / 1_000_000).toFixed(1)}M`;
}

/**
 * Sanitize extension status text for single-line display.
 * Mirrors the native footer's sanitizeStatusText.
 */
function sanitizeStatusText(text: string): string {
	return text
		.replace(/[\r\n\t]/g, " ")
		.replace(/ +/g, " ")
		.trim();
}

type ModelLike = {
	id: string;
	provider: string;
	reasoning?: boolean;
	contextWindow?: number;
};

type ContextUsageLike = {
	tokens: number | null;
	contextWindow: number;
	percent: number | null;
};

type CtxLike = {
	cwd: string;
	model?: ModelLike | undefined;
	thinkingLevel: string | undefined;
	getContextUsage(): ContextUsageLike | undefined;
};

type FooterDataLike = {
	getGitBranch(): string | null;
	getExtensionStatuses(): ReadonlyMap<string, string>;
	getAvailableProviderCount(): number;
	onBranchChange(callback: () => void): () => void;
};

type TUILike = { requestRender(): void };

/**
 * Footer component: same rendering pipeline as Pi's native FooterComponent,
 * with the stats line reduced to "<tokens> (<percent>%)".
 */
class SimplifiedContextFooter {
	private ctx: CtxLike;
	private footerData: FooterDataLike;
	private tui: TUILike;
	private unsubBranch?: () => void;

	constructor(ctx: CtxLike, footerData: FooterDataLike, tui: TUILike) {
		this.ctx = ctx;
		this.footerData = footerData;
		this.tui = tui;
		// Re-render when the git branch changes (Pi's native footer does the same).
		this.unsubBranch = footerData.onBranchChange(() => tui.requestRender());
	}

	invalidate(): void {
		// No cached state to refresh; theme/cwd/branch are read live at render.
	}

	dispose(): void {
		this.unsubBranch?.();
	}

	render(width: number): string[] {
		const ctx = this.ctx;
		const model = ctx.model;
		const fmt = nativeFooter!;
		const th = themeSingleton!;

		// --- pwd line (identical to native footer) ---
		let pwd = fmt.formatCwdForFooter(ctx.cwd, process.env.HOME || process.env.USERPROFILE);
		const branch = this.footerData.getGitBranch();
		if (branch) {
			pwd = `${pwd} (${branch})`;
		}

		// --- context usage (simplified) ---
		// ctx.getContextUsage() returns the same value the native footer uses.
		// Fall back to the model's contextWindow if usage is unavailable.
		const usage = ctx.getContextUsage();
		const tokens = usage?.tokens ?? null;
		const percentValue = usage?.percent ?? null;

		// Build the single stats part: "<tokens> (<percent>%)" or "?" when unknown.
		// Colorize percent the same way the native footer does (>90 error, >70 warning).
		let contextPart: string;
		if (tokens === null || percentValue === null) {
			// After compaction, before next response: unknown. Mirror native "?"
			// display but without the context-window size (it must not be shown).
			contextPart = th.fg("dim", "?");
		} else {
			const tokensStr = formatContextTokens(tokens);
			const percentStr = percentValue.toFixed(1);
			// Color the whole "tokens (percent%)" by percent threshold, matching
			// the native footer's threshold coloring on the context segment.
			const display = `${tokensStr} (${percentStr}%)`;
			if (percentValue > 90) {
				contextPart = th.fg("error", display);
			} else if (percentValue > 70) {
				contextPart = th.fg("warning", display);
			} else {
				contextPart = display;
			}
		}

		const statsParts: string[] = [contextPart];
		if (areExperimentalFeaturesEnabled!()) {
			statsParts.push(`${th.fg("dim", "•")} ${th.bold(th.fg("warning", "xp"))}`);
		}
		let statsLeft = statsParts.join(" ");

		// --- right side: model [+ thinking level] [+ provider prefix] (identical to native) ---
		const modelName = model?.id || "no-model";
		let statsLeftWidth = visibleWidth(statsLeft);
		if (statsLeftWidth > width) {
			statsLeft = truncateToWidth(statsLeft, width, "...");
			statsLeftWidth = visibleWidth(statsLeft);
		}

		const minPadding = 2;
		let rightSideWithoutProvider = modelName;
		if (model?.reasoning) {
			const thinkingLevel = ctx.thinkingLevel || "off";
			rightSideWithoutProvider =
				thinkingLevel === "off" ? `${modelName} • thinking off` : `${modelName} • ${thinkingLevel}`;
		}

		let rightSide = rightSideWithoutProvider;
		if (this.footerData.getAvailableProviderCount() > 1 && model) {
			rightSide = `(${model.provider}) ${rightSideWithoutProvider}`;
			if (statsLeftWidth + minPadding + visibleWidth(rightSide) > width) {
				rightSide = rightSideWithoutProvider;
			}
		}

		const rightSideWidth = visibleWidth(rightSide);
		const totalNeeded = statsLeftWidth + minPadding + rightSideWidth;
		let statsLine: string;
		if (totalNeeded <= width) {
			const padding = " ".repeat(width - statsLeftWidth - rightSideWidth);
			statsLine = statsLeft + padding + rightSide;
		} else {
			const availableForRight = width - statsLeftWidth - minPadding;
			if (availableForRight > 0) {
				const truncatedRight = truncateToWidth(rightSide, availableForRight, "");
				const truncatedRightWidth = visibleWidth(truncatedRight);
				const padding = " ".repeat(Math.max(0, width - statsLeftWidth - truncatedRightWidth));
				statsLine = statsLeft + padding + truncatedRight;
			} else {
				statsLine = statsLeft;
			}
		}

		// Dim stats and remainder independently (statsLeft may contain color resets).
		const dimStatsLeft = th.fg("dim", statsLeft);
		const remainder = statsLine.slice(statsLeft.length);
		const dimRemainder = th.fg("dim", remainder);
		const pwdLine = truncateToWidth(th.fg("dim", pwd), width, th.fg("dim", "..."));
		const lines = [pwdLine, dimStatsLeft + dimRemainder];

		// --- extension status lines (identical to native footer) ---
		const extensionStatuses = this.footerData.getExtensionStatuses();
		if (extensionStatuses.size > 0) {
			const sortedStatuses = Array.from(extensionStatuses.entries())
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([, text]) => sanitizeStatusText(text));
			const statusLine = sortedStatuses.join(" ");
			lines.push(truncateToWidth(statusLine, width, th.fg("dim", "...")));
		}

		return lines;
	}
}

export default function (pi: ExtensionAPI) {
	let installed = false;

	const install = async (ctx: ExtensionContextLike) => {
		if (installed) return;
		if (ctx.mode !== "tui" || !ctx.hasUI) return;

		await loadNativeHelpers(getPackageDir());

		ctx.ui.setFooter((tui: TUILike, _theme: unknown, footerData: unknown) => {
			// ctx is captured from the session_start closure; its getters (model,
			// thinkingLevel, getContextUsage, cwd) always reflect the live session.
			return new SimplifiedContextFooter(
				ctx as unknown as CtxLike,
				footerData as FooterDataLike,
				tui,
			);
		});
		installed = true;
	};

	pi.on("session_start", async (_event, ctx) => {
		await install(ctx as unknown as ExtensionContextLike);
	});
}

// Minimal local types to avoid depending on private Pi internals in the
// signature. The actual ctx passed at runtime is the full ExtensionContext.
interface ExtensionContextLike {
	mode: string;
	hasUI: boolean;
	cwd: string;
	model?: ModelLike | undefined;
	thinkingLevel: string | undefined;
	getContextUsage(): ContextUsageLike | undefined;
	ui: {
		setFooter(
			factory:
				| ((
						tui: TUILike,
						theme: unknown,
						footerData: unknown,
				  ) => { render(width: number): string[]; invalidate(): void; dispose?(): void })
				| undefined,
		): void;
	};
}
