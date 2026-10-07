#!/usr/bin/env node
/**
 * 前置校验：站内链接悬浮预览索引（src/.vuepress/public/previews.json）
 *
 * 这个文件由 config.ts 的 onPrepared 钩子在构建期生成，供 PagePreview 组件读取。
 * 它是**构建产物**（已在 .gitignore 中），所以一旦生成逻辑出问题，仓库里不会有 diff
 * 能提示你——只会在线上表现为「链接悬浮时没有预览」，而且不报错。
 * 因此把它挂到 build 之后做一次显式校验，让问题在构建阶段就暴露。
 *
 * 退出码 0 = 通过，1 = 失败（package.json 的 build 脚本会因此中断）。
 */
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATES = [
	join(root, "src/.vuepress/public/previews.json"),
	join(root, "src/.vuepress/dist/previews.json"),
];

const fail = (title, details = []) => {
	console.error(`\n✖ 预览索引校验失败：${title}`);
	for (const line of details) console.error(`  · ${line}`);
	console.error("  提示：该文件由 config.ts 的 onPrepared 钩子生成，若缺失请检查该钩子是否被触发。\n");
	process.exit(1);
};

let target = null;
for (const candidate of CANDIDATES) {
	try {
		const info = await stat(candidate);
		if (info.size > 0) {
			target = candidate;
			break;
		}
	} catch {
		// 继续尝试下一个候选路径
	}
}

if (!target) {
	fail("文件不存在或为空", CANDIDATES.map((p) => `已尝试：${p.replace(root, ".")}`));
}

const raw = await readFile(target, "utf8");

let index;
try {
	index = JSON.parse(raw);
} catch (error) {
	fail("不是合法 JSON", [String(error?.message ?? error)]);
}

if (!index || typeof index !== "object" || Array.isArray(index)) {
	fail("顶层结构不是对象", [`实际为：${Array.isArray(index) ? "数组" : typeof index}`]);
}

const entries = Object.entries(index);
if (entries.length === 0) {
	fail("索引为空（0 条页面）", [
		"这通常意味着 onPrepared 触发时 app.pages 尚未就绪，或标题提取逻辑失效。",
	]);
}

const missingTitle = [];
const badShape = [];
for (const [path, entry] of entries) {
	if (!entry || typeof entry !== "object") {
		badShape.push(path);
		continue;
	}
	if (typeof entry.title !== "string" || entry.title.trim() === "") missingTitle.push(path);
}

if (missingTitle.length > 0) {
	fail(`${missingTitle.length} 条记录缺少标题`, [
		...missingTitle.slice(0, 5),
		missingTitle.length > 5 ? `…另有 ${missingTitle.length - 5} 条` : "",
	].filter(Boolean));
}

if (badShape.length > 0) {
	fail(`${badShape.length} 条记录结构异常`, badShape.slice(0, 5));
}

const relative = target.replace(root, ".");
const sizeKb = (Buffer.byteLength(raw) / 1024).toFixed(1);
const withDescription = entries.filter(([, e]) => typeof e.description === "string" && e.description.trim()).length;
const withCover = entries.filter(([, e]) => typeof e.cover === "string" && e.cover.trim()).length;

console.log(
	`✔ 预览索引校验通过：${relative} — ${entries.length} 条记录，` +
		`${withDescription} 条含摘要，${withCover} 条含封面，${sizeKb}KB`,
);
