<template>
	<div
		ref="rootEl"
		class="vp-meting"
		:class="{
			'is-playing': isPlaying,
			'is-loading': state === 'loading' || state === 'idle',
			'is-error': state === 'error',
		}"
		:style="rootStyle"
		role="region"
		:aria-label="'音乐播放器：' + displayTitle"
		@keydown="onKeydown"
		@pointerenter="upgradePreload"
		@focusin="upgradePreload"
	>
		<div class="vp-meting__main">
			<div class="vp-meting__cover">
				<div class="vp-meting__cover-fallback" aria-hidden="true">
					<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 18V5l12-2v13" />
						<circle cx="6" cy="18" r="3" />
						<circle cx="18" cy="16" r="3" />
					</svg>
				</div>
				<img
					v-if="coverUrl && !coverBroken"
					class="vp-meting__cover-img"
					:class="{ 'is-ready': coverReady }"
					:src="coverUrl"
					:alt="displayTitle + ' 封面'"
					loading="eager"
					fetchpriority="high"
					decoding="async"
					@load="onCoverLoad"
					@error="onCoverError"
				/>
				<span v-if="isPlaying" class="vp-meting__cover-eq" aria-hidden="true">
					<i /><i /><i />
				</span>
			</div>

			<div class="vp-meting__body">
				<div class="vp-meting__titles">
					<div class="vp-meting__title" role="heading" aria-level="3" :title="displayTitle">
						{{ displayTitle }}
					</div>
					<div class="vp-meting__artist" :class="{ 'is-error': audioError }">{{ displayArtist }}</div>
				</div>

				<div class="vp-meting__progress">
					<div
						class="vp-meting__slider"
						:class="{ 'is-disabled': !ready }"
						:style="{ '--mp-ratio': progressPercent / 100 }"
					>
						<div class="vp-meting__slider-rail" aria-hidden="true" />
						<div class="vp-meting__slider-fill" aria-hidden="true" />
						<div class="vp-meting__slider-thumb" aria-hidden="true" />
						<input
							class="vp-meting__range"
							type="range"
							min="0"
							:max="duration || 0"
							step="0.1"
							:value="currentTime"
							:disabled="!ready"
							aria-label="播放进度"
							@input="onSeek"
						/>
					</div>
					<div class="vp-meting__times">
						<span>{{ formatTime(currentTime) }}</span>
						<span>{{ formatTime(duration) }}</span>
					</div>
				</div>

				<div class="vp-meting__controls">
					<div class="vp-meting__transport">
						<button
							v-if="tracks.length > 1"
							type="button"
							class="vp-meting__btn"
							aria-label="上一首"
							@click="prevTrack"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M19 5v14" />
								<path d="M16 5 5 12l11 7V5Z" fill="currentColor" stroke="none" />
							</svg>
						</button>

						<button
							type="button"
							class="vp-meting__play"
							:disabled="state === 'loading'"
							:aria-label="playLabel"
							@click="togglePlay"
						>
							<svg
								v-if="state === 'loading'"
								class="vp-meting__spinner"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.2" opacity="0.28" />
								<path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
							</svg>
							<svg
								v-else-if="state === 'error'"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M21 12a9 9 0 1 1-2.64-6.36" />
								<path d="M21 3v6h-6" />
							</svg>
							<svg v-else-if="isPlaying" viewBox="0 0 24 24" aria-hidden="true">
								<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
								<rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" />
							</svg>
							<svg v-else viewBox="0 0 24 24" aria-hidden="true">
								<path
									d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11.14-6.86a1 1 0 0 0 0-1.7L9.52 4.29A1 1 0 0 0 8 5.14Z"
									fill="currentColor"
								/>
							</svg>
						</button>

						<button
							v-if="tracks.length > 1"
							type="button"
							class="vp-meting__btn"
							aria-label="下一首"
							@click="nextTrack"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M5 5v14" />
								<path d="M8 5l11 7-11 7V5Z" fill="currentColor" stroke="none" />
							</svg>
						</button>
					</div>

					<div class="vp-meting__volume">
						<button
							type="button"
							class="vp-meting__btn vp-meting__volume-btn"
							:aria-label="isMuted ? '取消静音' : '静音'"
							@click="toggleMute"
						>
							<svg
								v-if="isMuted"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.9"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" fill="currentColor" stroke="none" />
								<path d="m16 9 5 6M21 9l-5 6" />
							</svg>
							<svg
								v-else
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.9"
								stroke-linecap="round"
								stroke-linejoin="round"
								aria-hidden="true"
							>
								<path d="M11 5 6.5 8.5H3v7h3.5L11 19V5Z" fill="currentColor" stroke="none" />
								<path d="M15.5 8.5a5 5 0 0 1 0 7" />
								<path d="M18.5 6a9 9 0 0 1 0 12" />
							</svg>
						</button>
						<div
							class="vp-meting__slider vp-meting__slider--volume"
							:style="{ '--mp-ratio': volumePercent / 100 }"
						>
							<div class="vp-meting__slider-rail" aria-hidden="true" />
							<div class="vp-meting__slider-fill" aria-hidden="true" />
							<div class="vp-meting__slider-thumb" aria-hidden="true" />
							<input
								class="vp-meting__range"
								type="range"
								min="0"
								max="100"
								step="1"
								:value="volumePercent"
								aria-label="音量"
								@input="onVolumeInput"
							/>
						</div>
					</div>

					<div class="vp-meting__actions">
						<button
							v-if="currentTrack?.lrc"
							type="button"
							class="vp-meting__action"
							:class="{ 'is-active': lyricsOpen }"
							:aria-label="lyricsOpen ? '隐藏歌词' : '显示歌词'"
							:aria-pressed="lyricsOpen"
							@click="toggleLyrics"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-3 2.5V11.5a8.5 8.5 0 1 1 18 0Z" />
								<path d="M7.5 9.5h9M7.5 13.5h6" />
							</svg>
							<span class="vp-meting__action-label">歌词</span>
						</button>

						<button
							v-if="tracks.length > 1"
							type="button"
							class="vp-meting__action"
							:class="{ 'is-active': listOpen }"
							:aria-label="listOpen ? '收起播放列表' : '展开播放列表'"
							:aria-pressed="listOpen"
							@click="toggleList"
						>
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
								<path d="M8 6h13M8 12h13M8 18h13" />
								<circle cx="3.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
								<circle cx="3.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
								<circle cx="3.5" cy="18" r="1.1" fill="currentColor" stroke="none" />
							</svg>
							<span class="vp-meting__action-label">列表</span>
							<span class="vp-meting__action-count">{{ tracks.length }}</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<div
			class="vp-meting__panel"
			:class="{ 'is-open': lyricsOpen }"
			:inert="!lyricsOpen"
			:aria-hidden="!lyricsOpen"
		>
			<div class="vp-meting__panel-inner">
				<div class="vp-meting__panel-body">
					<div ref="lyricsEl" class="vp-meting__lyrics">
						<div v-if="lyricsLoading" class="vp-meting__lyrics-empty">歌词加载中…</div>
						<div v-else-if="lyrics.length === 0" class="vp-meting__lyrics-empty">暂无歌词</div>
						<template v-else>
							<button
								v-for="(line, index) in lyrics"
								:key="line.time + '-' + index"
								type="button"
								class="vp-meting__lyric"
								:class="{ 'is-active': index === activeLyric }"
								:data-active="index === activeLyric"
								@click="seekToLine(line)"
							>
								{{ line.text }}
							</button>
						</template>
					</div>
				</div>
			</div>
		</div>

		<div
			class="vp-meting__panel"
			:class="{ 'is-open': listOpen }"
			:inert="!listOpen"
			:aria-hidden="!listOpen"
		>
			<div class="vp-meting__panel-inner">
				<div class="vp-meting__panel-body">
					<div
						ref="listEl"
						class="vp-meting__list"
						role="list"
						:style="{ maxHeight: listMaxHeight }"
					>
						<div
							v-for="(track, index) in tracks"
							:key="track.url + '-' + index"
							class="vp-meting__list-item"
							role="listitem"
						>
							<button
								type="button"
								class="vp-meting__track"
								:class="{ 'is-active': index === currentIndex }"
								:data-current="index === currentIndex"
								:aria-current="index === currentIndex ? 'true' : undefined"
								@click="selectTrack(index)"
							>
								<span class="vp-meting__track-index" aria-hidden="true">
									<span v-if="index === currentIndex && isPlaying" class="vp-meting__eq">
										<i /><i /><i />
									</span>
									<template v-else>{{ index + 1 }}</template>
								</span>
								<span class="vp-meting__track-meta">
									<span class="vp-meting__track-name">{{ track.name }}</span>
									<span class="vp-meting__track-artist">{{ track.artist }}</span>
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<audio
			ref="audioEl"
			class="vp-meting__audio"
			:src="currentTrack ? currentTrack.url : undefined"
			:preload="audioPreload"
			@loadedmetadata="onLoadedMetadata"
			@durationchange="onDurationChange"
			@timeupdate="onTimeUpdate"
			@play="onPlay"
			@pause="onPause"
			@ended="onEnded"
			@error="onAudioError"
		/>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

/**
 * MetingPlayer —— 站内 Meting 播放器（替代 APlayer）
 *
 * 设计目标：
 * 1. 封面优先：大尺寸封面 + 封面取色模糊背景，识别度远高于 APlayer 的 66px 小图；
 * 2. 与主题一致：全部颜色取 var(--vp-c-*)，明暗主题、强调色自动跟随；
 * 3. 不拖慢长文：只有滚动到附近才请求 Meting API，多播放器共享请求缓存；
 * 4. 功能不缩水：进度/音量、上一首/下一首、播放列表、LRC 歌词（同步高亮 + 点击跳转）；
 * 5. 同时只响一个：页面内多个播放器通过模块级注册表互斥。
 *
 * 用法与旧组件一致：<Meting mid="..." type="song" api="..." />
 */

defineOptions({ name: "MetingPlayer" });

interface MetingEntry {
	mid?: string;
	server?: string;
	type?: string;
	api?: string;
	auth?: string;
	auto?: string;
}

interface Track {
	name: string;
	artist: string;
	url: string;
	cover: string;
	lrc: string;
	server: string;
}

interface LyricLine {
	time: number;
	text: string;
}

const DEFAULT_API = "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&auth=:auth&r=:r";
/** 同一次页面会话固定，既保留 :r 的缓存破坏语义，又让多播放器命中同一份缓存 */
const SESSION_BUST = Math.random().toString(36).slice(2, 8);
/** 页面内所有播放器实例，用于互斥播放 */
const registry = new Set<{ pause: () => void }>();
/** Meting API 请求缓存：url → tracks */
const trackCache = new Map<string, Promise<Track[]>>();

const props = withDefaults(
	defineProps<{
		mid?: string;
		server?: string;
		type?: string;
		api?: string;
		auth?: string;
		auto?: string;
		list?: MetingEntry[];
		autoplay?: boolean | string;
		loop?: string;
		order?: string;
		volume?: number | string;
		listFolded?: boolean | string;
		listMaxHeight?: string;
		theme?: string;
		mutex?: boolean | string;
	}>(),
	{
		mid: "",
		server: "netease",
		type: "song",
		api: DEFAULT_API,
		auth: "auth",
		auto: "",
		list: () => [],
		autoplay: false,
		loop: "all",
		order: "list",
		volume: 0.7,
		listFolded: true,
		listMaxHeight: "280px",
		theme: "",
		mutex: true,
	},
);

const rootEl = ref<HTMLElement | null>(null);
const audioEl = ref<HTMLAudioElement | null>(null);
const lyricsEl = ref<HTMLElement | null>(null);
const listEl = ref<HTMLElement | null>(null);

const state = ref<"idle" | "loading" | "ready" | "error">("idle");
const tracks = ref<Track[]>([]);
const currentIndex = ref(0);
const currentTime = ref(0);
const duration = ref(0);
const isPlaying = ref(false);
const audioError = ref(false);
const coverReady = ref(false);
const coverBroken = ref(false);
/** 音频按需预载：进入视口 / 指针悬停 / 键盘聚焦后才升级为 auto */
const audioPreload = ref<"none" | "metadata" | "auto">("none");

const lyricsOpen = ref(false);
const lyrics = ref<LyricLine[]>([]);
const lyricsLoading = ref(false);
const lyricsFailed = ref(false);
const activeLyric = ref(-1);
let lyricsTrackUrl = "";
let lyricsToken = 0;

const listOpen = ref(!asBool(props.listFolded, true));
const volume = ref(clamp(toNumber(props.volume, 0.7), 0, 1));
const muted = ref(false);
let lastVolume = 0.7;

const currentTrack = computed<Track | null>(() => tracks.value[currentIndex.value] ?? null);
const coverSource = computed(() => currentTrack.value?.cover ?? "");
const resolvedCover = ref("");
let coverToken = 0;
const coverUrl = computed(() => resolvedCover.value);
const ready = computed(() => state.value === "ready" && !!currentTrack.value);
const displayTitle = computed(() => {
	if (currentTrack.value) return currentTrack.value.name;
	return state.value === "error" ? "无法加载音频" : "正在载入…";
});
const displayArtist = computed(() => {
	if (audioError.value) {
		return currentTrack.value
			? `${currentTrack.value.artist} · 音频加载失败，点击播放重试`
			: "音频加载失败";
	}
	if (currentTrack.value) return currentTrack.value.artist;
	if (state.value === "error") return "Meting API 请求失败，点击播放键重试";
	return "正在获取曲目信息";
});
const playLabel = computed(() => {
	if (state.value === "error") return "重试加载";
	if (isPlaying.value) return "暂停";
	return "播放";
});
const progressPercent = computed(() =>
	duration.value > 0 ? Math.round(clamp(currentTime.value / duration.value, 0, 1) * 10000) / 100 : 0,
);
const volumePercent = computed(() => Math.round(volume.value * 100));
const isMuted = computed(() => muted.value || volume.value === 0);
const wantsAutoplay = computed(() => asBool(props.autoplay, false));
const isMutex = computed(() => asBool(props.mutex, true));

const hue = computed(() => hashHue(currentTrack.value?.name || props.mid || "meting"));
const rootStyle = computed<Record<string, string>>(() => {
	const style: Record<string, string> = { "--mp-hue": String(hue.value) };
	if (props.theme) style["--mp-accent"] = props.theme;
	return style;
});

const metingEntries = computed<MetingEntry[]>(() => {
	const entries: MetingEntry[] = [];
	if (props.mid || props.auto) {
		entries.push({
			mid: props.mid,
			server: props.server,
			type: props.type,
			api: props.api,
			auth: props.auth,
			auto: props.auto,
		});
	}
	for (const item of props.list ?? []) {
		if (!item || (!item.mid && !item.auto)) continue;
		entries.push({
			mid: item.mid,
			server: item.server || props.server,
			type: item.type || props.type,
			api: item.api || props.api,
			auth: item.auth || props.auth,
			auto: item.auto,
		});
	}
	return entries;
});

let loadToken = 0;
let observer: IntersectionObserver | null = null;
let preloadObserver: IntersectionObserver | null = null;
const instance = { pause: (): void => void audioEl.value?.pause() };

async function loadTracks(): Promise<void> {
	if (state.value === "loading" || state.value === "ready") return;
	const entries = metingEntries.value;
	if (!entries.length) {
		state.value = "error";
		return;
	}

	const token = ++loadToken;
	state.value = "loading";

	try {
		const results = await Promise.allSettled(entries.map(fetchEntry));
		if (token !== loadToken) return;
		const list = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
		if (!list.length) throw new Error("Meting API 未返回可播放曲目");
		tracks.value = list;
		currentIndex.value = 0;
		state.value = "ready";
		await nextTick();
		// 已经在视口内的播放器，直接开始缓冲当前曲目
		if (audioPreload.value === "auto") upgradePreload();
		if (wantsAutoplay.value) void playCurrent();
	} catch (error) {
		if (token !== loadToken) return;
		state.value = "error";
		tracks.value = [];
		console.warn("[MetingPlayer] 加载失败：", error);
	}
}

function fetchEntry(entry: MetingEntry): Promise<Track[]> {
	const url = buildApiUrl(entry);
	if (!url) return Promise.reject(new Error("无效的 Meting 参数"));

	const cached = trackCache.get(url);
	if (cached) return cached;

	const task = requestTracks(url, entry.server || props.server).catch((error: unknown) => {
		trackCache.delete(url);
		throw error;
	});
	trackCache.set(url, task);
	return task;
}

async function requestTracks(url: string, fallbackServer: string): Promise<Track[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 15000);
	try {
		const response = await fetch(url, { signal: controller.signal, credentials: "omit" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		return normalizeTracks(await response.json(), fallbackServer);
	} finally {
		clearTimeout(timer);
	}
}

function buildApiUrl(entry: MetingEntry): string {
	let mid = entry.mid ?? "";
	let server = entry.server || props.server || "netease";
	let type = entry.type || props.type || "song";

	if (entry.auto) {
		const parsed = parseMetingLink(entry.auto);
		if (parsed) {
			server = parsed.server;
			type = parsed.type;
			mid = parsed.mid;
		}
	}
	if (!mid) return "";

	const api = (entry.api || props.api || "").trim();
	if (!api) return "";
	return api
		.replaceAll(":server", encodeURIComponent(server))
		.replaceAll(":type", encodeURIComponent(type))
		.replaceAll(":id", encodeURIComponent(mid))
		.replaceAll(":auth", encodeURIComponent(entry.auth || props.auth || "auth"))
		.replaceAll(":r", SESSION_BUST);
}

async function togglePlay(): Promise<void> {
	upgradePreload();
	if (state.value === "error") {
		state.value = "idle";
		await loadTracks();
		await nextTick();
		if (state.value === "ready") await playCurrent();
		return;
	}
	if (state.value !== "ready") {
		await loadTracks();
		await nextTick();
		if (state.value !== "ready") return;
	}

	const el = audioEl.value;
	if (!el) return;
	if (el.paused) await playCurrent();
	else el.pause();
}

function pauseOthers(): void {
	if (!isMutex.value) return;
	for (const other of registry) if (other !== instance) other.pause();
}

/** 页面上任意媒体开始播放时，当前播放器立即让位 */
function pauseOtherMedia(): void {
	if (!isMutex.value) return;
	pauseOthers();
	if (typeof document === "undefined") return;
	for (const media of document.querySelectorAll<HTMLMediaElement>("audio, video")) {
		if (media !== audioEl.value && !media.paused) media.pause();
	}
}

/** 其他 <audio>/<video> 开始播放时，暂停自己（含文章内的 VidStack 视频） */
function onDocumentPlay(event: Event): void {
	if (!isMutex.value) return;
	const target = event.target;
	if (!(target instanceof HTMLMediaElement)) return;
	if (target === audioEl.value) return;
	audioEl.value?.pause();
}

/** 进入视口 / 悬停 / 聚焦时才真正下载音频，避免长文一次性预载几十首 */
function upgradePreload(): void {
	audioPreload.value = "auto";
	const el = audioEl.value;
	if (!el) return;
	el.preload = "auto";
	if (el.readyState === 0 && !isPlaying.value && el.currentTime === 0 && el.getAttribute("src")) {
		try {
			el.load();
		} catch {
			// 忽略 src 尚未就绪时的异常
		}
	}
}

async function playCurrent(): Promise<void> {
	const el = audioEl.value;
	if (!el || !currentTrack.value) return;
	pauseOtherMedia();
	applyAudioSettings();
	try {
		await el.play();
	} catch (error) {
		// 浏览器自动播放策略拦截或媒体本身不可播：保持暂停态即可，
		// 真正的媒体错误由 @error 事件负责提示。
		isPlaying.value = false;
		console.warn("[MetingPlayer] 播放被阻止：", error);
	}
}

async function selectTrack(index: number): Promise<void> {
	if (index < 0 || index >= tracks.value.length) return;
	if (index === currentIndex.value) {
		await togglePlay();
		return;
	}
	currentIndex.value = index;
	currentTime.value = 0;
	duration.value = 0;
	audioError.value = false;
	await nextTick();
	await playCurrent();
}

async function nextTrack(): Promise<void> {
	if (tracks.value.length <= 1) {
		replayCurrent();
		return;
	}
	await selectTrack(nextIndex());
}

function prevTrack(): void {
	if (tracks.value.length <= 1) {
		replayCurrent();
		return;
	}
	const el = audioEl.value;
	if (el && el.currentTime > 3) {
		el.currentTime = 0;
		currentTime.value = 0;
		return;
	}
	void selectTrack((currentIndex.value - 1 + tracks.value.length) % tracks.value.length);
}

function nextIndex(): number {
	const length = tracks.value.length;
	if (length <= 1) return 0;
	if (String(props.order) === "random") {
		let index = currentIndex.value;
		while (index === currentIndex.value) index = Math.floor(Math.random() * length);
		return index;
	}
	return (currentIndex.value + 1) % length;
}

function replayCurrent(): void {
	const el = audioEl.value;
	if (!el) return;
	try {
		el.currentTime = 0;
	} catch {
		// metadata 尚未就绪时忽略
	}
	void playCurrent();
}

function onEnded(): void {
	const mode = String(props.loop || "all").toLowerCase();
	if (mode === "one") {
		replayCurrent();
		return;
	}
	if (mode === "none" && currentIndex.value >= tracks.value.length - 1) {
		isPlaying.value = false;
		return;
	}
	if (tracks.value.length > 1) void nextTrack();
	else replayCurrent();
}

function onPlay(): void {
	isPlaying.value = true;
	audioError.value = false;
	pauseOtherMedia();
}

function onPause(): void {
	isPlaying.value = false;
}

function onLoadedMetadata(): void {
	const el = audioEl.value;
	duration.value = el && Number.isFinite(el.duration) ? el.duration : 0;
	audioError.value = false;
}

function onDurationChange(): void {
	const el = audioEl.value;
	duration.value = el && Number.isFinite(el.duration) ? el.duration : 0;
}

function onTimeUpdate(): void {
	const el = audioEl.value;
	if (!el) return;
	currentTime.value = Number.isFinite(el.currentTime) ? el.currentTime : 0;
	if (lyricsOpen.value && lyrics.value.length) activeLyric.value = findActiveLyric(lyrics.value, currentTime.value);
}

function onAudioError(): void {
	if (!audioEl.value?.src) return;
	audioError.value = true;
	isPlaying.value = false;
}

function onSeek(event: Event): void {
	const value = Number((event.target as HTMLInputElement).value);
	if (!Number.isFinite(value)) return;
	const el = audioEl.value;
	if (!el) return;
	try {
		el.currentTime = value;
	} catch {
		// metadata 尚未就绪时忽略
	}
	currentTime.value = value;
	if (lyrics.value.length) activeLyric.value = findActiveLyric(lyrics.value, value);
}

function onVolumeInput(event: Event): void {
	const value = Number((event.target as HTMLInputElement).value);
	if (!Number.isFinite(value)) return;
	volume.value = clamp(value / 100, 0, 1);
	if (muted.value && value > 0) muted.value = false;
}

function toggleMute(): void {
	if (muted.value || volume.value === 0) {
		muted.value = false;
		volume.value = lastVolume > 0 ? lastVolume : 0.7;
	} else {
		lastVolume = volume.value;
		muted.value = true;
	}
}

function applyAudioSettings(): void {
	const el = audioEl.value;
	if (!el) return;
	el.volume = volume.value;
	el.muted = muted.value;
}

function onCoverLoad(): void {
	coverReady.value = true;
}

function onCoverError(): void {
	if (resolvedCover.value && coverSource.value && resolvedCover.value !== coverSource.value) {
		resolvedCover.value = coverSource.value;
		coverBroken.value = false;
		coverReady.value = false;
		return;
	}
	coverBroken.value = true;
	coverReady.value = false;
}

function toggleLyrics(): void {
	if (!currentTrack.value?.lrc) return;
	lyricsOpen.value = !lyricsOpen.value;
	if (lyricsOpen.value) {
		listOpen.value = false;
		void ensureLyrics();
		void nextTick(() => scrollLyrics(true));
	}
}

async function ensureLyrics(): Promise<void> {
	const track = currentTrack.value;
	if (!track?.lrc) return;
	if (lyricsTrackUrl === track.lrc && (lyrics.value.length > 0 || lyricsLoading.value || lyricsFailed.value)) return;

	lyricsTrackUrl = track.lrc;
	const token = ++lyricsToken;
	lyricsLoading.value = true;
	lyricsFailed.value = false;
	lyrics.value = [];

	try {
		const response = await fetch(track.lrc, { credentials: "omit" });
		if (!response.ok) throw new Error(`HTTP ${response.status}`);
		const parsed = parseLrc(await response.text());
		if (token !== lyricsToken) return;
		lyrics.value = parsed;
		lyricsFailed.value = parsed.length === 0;
		activeLyric.value = parsed.length ? findActiveLyric(parsed, currentTime.value) : -1;
	} catch {
		if (token !== lyricsToken) return;
		lyrics.value = [];
		lyricsFailed.value = true;
	} finally {
		if (token === lyricsToken) lyricsLoading.value = false;
	}
}

function toggleList(): void {
	if (tracks.value.length <= 1) return;
	listOpen.value = !listOpen.value;
	if (listOpen.value) {
		lyricsOpen.value = false;
		void nextTick(() => scrollActiveTrack(true));
	}
}

function seekToLine(line: LyricLine): void {
	const el = audioEl.value;
	if (!el) return;
	try {
		el.currentTime = Math.max(0, line.time);
	} catch {
		return;
	}
	currentTime.value = el.currentTime;
	activeLyric.value = findActiveLyric(lyrics.value, el.currentTime);
	if (el.paused) void playCurrent();
}

function scrollLyrics(force = false): void {
	if (!lyricsOpen.value || activeLyric.value < 0) return;
	const container = lyricsEl.value;
	const item = container?.querySelector<HTMLElement>('[data-active="true"]');
	if (!container || !item) return;
	if (!force && !container.isConnected) return;
	const top = item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2;
	container.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function scrollActiveTrack(force = false): void {
	if (!listOpen.value) return;
	const container = listEl.value;
	const item = container?.querySelector<HTMLElement>('[data-current="true"]');
	if (!container || !item) return;
	if (!force && !container.isConnected) return;
	const top = item.offsetTop - container.clientHeight / 2 + item.offsetHeight / 2;
	container.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function onKeydown(event: KeyboardEvent): void {
	if (event.key === "Escape" && (lyricsOpen.value || listOpen.value)) {
		lyricsOpen.value = false;
		listOpen.value = false;
	}
}

watch(volume, (value) => {
	const el = audioEl.value;
	if (el) el.volume = value;
	if (value > 0) lastVolume = value;
	writeStorage("vp-meting-volume", String(value));
});

watch(muted, (value) => {
	const el = audioEl.value;
	if (el) el.muted = value;
	writeStorage("vp-meting-muted", value ? "1" : "0");
});

watch(coverUrl, () => {
	coverReady.value = false;
	coverBroken.value = false;
});

/**
 * injahow 的 pic 接口只返回 90×90，且自身不接受尺寸参数；
 * 但它会 302 到 NetEase 原图地址。用 HEAD 跟随重定向拿到最终 URL，
 * 再把 param=90y90 换成大尺寸，避免低清图被放大后发虚。
 * HEAD 失败时回退到原代理地址，至少保证有封面。
 */
watch(
	coverSource,
	async (source) => {
		const token = ++coverToken;
		resolvedCover.value = "";
		if (!source) return;

		if (/music\.126\.net/i.test(source)) {
			resolvedCover.value = highResCover(source);
			return;
		}

		if (/api\.injahow\.cn\/meting/i.test(source)) {
			const resolved = await resolveInjahowCover(source);
			if (token !== coverToken) return;
			resolvedCover.value = resolved || source;
			return;
		}

		resolvedCover.value = source;
	},
	{ immediate: true },
);

watch(
	() => currentTrack.value?.url,
	() => {
		audioError.value = false;
		currentTime.value = 0;
		duration.value = 0;
		lyricsToken++;
		lyricsLoading.value = false;
		lyrics.value = [];
		lyricsTrackUrl = "";
		lyricsFailed.value = false;
		activeLyric.value = -1;
		if (lyricsOpen.value) void ensureLyrics();
	},
);

watch(activeLyric, () => void nextTick(() => scrollLyrics()));

watch(
	[currentIndex, listOpen],
	() => {
		if (listOpen.value) void nextTick(() => scrollActiveTrack(true));
	},
	{ flush: "post" },
);

onMounted(() => {
	const storedVolume = Number(readStorage("vp-meting-volume"));
	if (Number.isFinite(storedVolume) && readStorage("vp-meting-volume") !== null) {
		volume.value = clamp(storedVolume, 0, 1);
	}
	muted.value = readStorage("vp-meting-muted") === "1";
	lastVolume = volume.value > 0 ? volume.value : 0.7;
	applyAudioSettings();

	registry.add(instance);
	document.addEventListener("play", onDocumentPlay, true);

	if (typeof IntersectionObserver === "undefined" || !rootEl.value) {
		upgradePreload();
		void loadTracks();
		return;
	}

	// 元数据：提前 400px 准备，保证滚到播放器时标题/封面已经就位
	observer = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			observer?.disconnect();
			observer = null;
			void loadTracks();
		},
		{ rootMargin: "400px 0px" },
	);
	observer.observe(rootEl.value);

	// 音频：真正进入视口后才升到 auto，避免一页几十个播放器同时拉音频
	preloadObserver = new IntersectionObserver(
		(entries) => {
			if (!entries.some((entry) => entry.isIntersecting)) return;
			preloadObserver?.disconnect();
			preloadObserver = null;
			upgradePreload();
		},
		{ threshold: 0.2 },
	);
	preloadObserver.observe(rootEl.value);
});

onBeforeUnmount(() => {
	loadToken++;
	lyricsToken++;
	observer?.disconnect();
	observer = null;
	preloadObserver?.disconnect();
	preloadObserver = null;
	document.removeEventListener("play", onDocumentPlay, true);
	registry.delete(instance);
	audioEl.value?.pause();
});

function normalizeTracks(payload: unknown, fallbackServer: string): Track[] {
	const rawList = Array.isArray(payload)
		? payload
		: payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
			? ((payload as { data: unknown[] }).data)
			: payload
				? [payload]
				: [];

	const result: Track[] = [];
	for (const raw of rawList) {
		if (!raw || typeof raw !== "object") continue;
		const item = raw as Record<string, unknown>;
		const url = toText(item.url);
		if (!/^https?:\/\//i.test(url)) continue;
		result.push({
			name: toText(item.name ?? item.title) || "未知曲目",
			artist: toText(item.artist ?? item.author ?? item.artists) || "未知艺术家",
			url,
			cover: highResCover(toText(item.cover ?? item.pic)),
			lrc: toText(item.lrc ?? item.lyric),
			server: toText(item.server) || fallbackServer,
		});
	}
	return result;
}

/** 跟随 injahow 的 pic 302，拿到 NetEase 原图地址后再提升分辨率 */
async function resolveInjahowCover(url: string): Promise<string> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 4000);
	try {
		const response = await fetch(url, {
			method: "HEAD",
			redirect: "follow",
			credentials: "omit",
			signal: controller.signal,
		});
		if (!response.ok || !response.url) return "";
		return highResCover(response.url);
	} catch {
		return "";
	} finally {
		clearTimeout(timer);
	}
}

/** 直接把 NetEase 封面 URL 的 param 提升到 500，避免放大后发虚 */
function highResCover(url: string): string {
	if (!url || !/music\.126\.net/i.test(url)) return url;
	const match = /([?&])param=(\d+)y(\d+)/i.exec(url);
	if (!match) return url;
	if (Number(match[2]) >= 400 && Number(match[3]) >= 400) return url;
	return url.replace(/([?&])param=\d+y\d+/i, "$1param=500y500");
}

function parseLrc(raw: string): LyricLine[] {
	const lines: LyricLine[] = [];
	let offset = 0;

	for (const source of raw.split(/\r?\n/)) {
		const trimmed = source.trim();
		const offsetMatch = /^\[offset:(-?\d+)\]/i.exec(trimmed);
		if (offsetMatch) {
			offset = Number(offsetMatch[1]) / 1000;
			continue;
		}

		const stamps = [...trimmed.matchAll(/\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
		if (!stamps.length) continue;
		const text = trimmed.replace(/\[[^\]]*\]/g, "").trim();
		if (!text) continue;

		for (const stamp of stamps) {
			const minutes = Number(stamp[1]);
			const seconds = Number(String(stamp[2]).replace(":", "."));
			if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) continue;
			lines.push({ time: Math.max(0, minutes * 60 + seconds + offset), text });
		}
	}

	return lines.sort((a, b) => a.time - b.time);
}

function findActiveLyric(lines: LyricLine[], time: number): number {
	let low = 0;
	let high = lines.length - 1;
	let answer = -1;
	while (low <= high) {
		const middle = (low + high) >> 1;
		if (lines[middle].time <= time + 0.15) {
			answer = middle;
			low = middle + 1;
		} else {
			high = middle - 1;
		}
	}
	return answer;
}

function parseMetingLink(link: string): { server: string; type: string; mid: string } | null {
	const rules: Array<[RegExp, string, string]> = [
		[/music\.163\.com\/.*\/song.*[?&]id=(\d+)/i, "netease", "song"],
		[/music\.163\.com\/.*\/album.*[?&]id=(\d+)/i, "netease", "album"],
		[/music\.163\.com\/.*\/artist.*[?&]id=(\d+)/i, "netease", "artist"],
		[/music\.163\.com\/.*\/playlist.*[?&]id=(\d+)/i, "netease", "playlist"],
		[/music\.163\.com\/discover\/toplist.*[?&]id=(\d+)/i, "netease", "playlist"],
		[/y\.qq\.com\/.*\/songDetail\/([A-Za-z0-9]+)/i, "tencent", "song"],
		[/y\.qq\.com\/.*\/song\/([A-Za-z0-9]+)/i, "tencent", "song"],
		[/y\.qq\.com\/.*\/album\/([A-Za-z0-9]+)/i, "tencent", "album"],
		[/y\.qq\.com\/.*\/singer\/([A-Za-z0-9]+)/i, "tencent", "artist"],
		[/y\.qq\.com\/.*\/playlist\/([A-Za-z0-9]+)/i, "tencent", "playlist"],
	];
	for (const [pattern, server, type] of rules) {
		const match = pattern.exec(link);
		if (match) return { server, type, mid: match[1] };
	}
	return null;
}

function toText(value: unknown): string {
	if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(" / ");
	if (value == null) return "";
	if (typeof value === "object" && "name" in value) return toText((value as { name?: unknown }).name);
	return String(value)
		.replace(/<[^>]*>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function toNumber(value: number | string | undefined, fallback: number): number {
	const parsed = typeof value === "number" ? value : Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

function asBool(value: boolean | string | undefined, fallback: boolean): boolean {
	if (value === undefined) return fallback;
	if (typeof value === "boolean") return value;
	return value === "" || value === "true" || value === "1";
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function hashHue(text: string): number {
	let hash = 0;
	for (let index = 0; index < text.length; index++) {
		hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
	}
	return hash % 360;
}

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
	const total = Math.floor(seconds);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const rest = total % 60;
	if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
	return `${minutes}:${String(rest).padStart(2, "0")}`;
}

function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function readStorage(key: string): string | null {
	try {
		return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStorage(key: string, value: string): void {
	try {
		if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
	} catch {
		// 隐私模式下写入失败可忽略
	}
}
</script>

<style lang="scss" scoped>
.vp-meting {
	--mp-accent: var(--vp-c-accent-bg, #0c7fda);
	--mp-accent-strong: var(--vp-c-accent-hover, #0d8df2);
	--mp-radius: 12px;
	--mp-cover-size: clamp(104px, 16cqw, 128px);
	--mp-hue: 210;

	container-name: vp-meting;
	container-type: inline-size;

	position: relative;
	isolation: isolate;
	box-sizing: border-box;
	width: 100%;
	margin: 1.6rem 0;
	overflow: hidden;
	color: var(--vp-c-text, #3c3c43);
	font-family: inherit;
	background: var(--vp-c-bg-elv, #fff);
	border: 1px solid var(--vp-c-divider, #e2e2e3);
	border-radius: var(--mp-radius);

	&,
	* {
		box-sizing: border-box;
	}

	button {
		font: inherit;
	}
}

.vp-meting__main {
	position: relative;
	z-index: 1;
	display: flex;
	gap: clamp(14px, 2.4vw, 24px);
	align-items: center;
	padding: clamp(14px, 2.2vw, 22px);
}

.vp-meting__cover {
	position: relative;
	flex: 0 0 auto;
	width: var(--mp-cover-size);
	aspect-ratio: 1;
	overflow: hidden;
	background: var(--vp-c-bg-alt, #f6f6f7);
	border: 1px solid var(--vp-c-divider, #e2e2e3);
	border-radius: calc(var(--mp-radius) - 4px);
}

.vp-meting__cover-img {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	opacity: 0;
	transition: opacity 0.45s ease;

	&.is-ready {
		opacity: 1;
	}
}

.vp-meting__cover-fallback {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	color: var(--vp-c-text-subtle, rgb(60 60 67 / 56%));
	background: var(--vp-c-bg-alt, #f6f6f7);

	svg {
		width: 36%;
		height: 36%;
		opacity: 0.9;
	}
}

.vp-meting__cover-eq {
	position: absolute;
	right: 10px;
	bottom: 10px;
	z-index: 2;
	display: inline-flex;
	gap: 2px;
	align-items: flex-end;
	height: 20px;
	padding: 4px 8px;
	background: rgb(0 0 0 / 55%);
	border-radius: 999px;
}

.vp-meting__eq {
	display: inline-flex;
	gap: 2px;
	align-items: flex-end;
	height: 12px;
	color: currentcolor;

	i {
		display: block;
		width: 2px;
		height: 100%;
		background: currentcolor;
		border-radius: 1px;
		transform-origin: bottom;
		animation: vp-meting-eq 1s ease-in-out infinite;

		&:nth-child(1) {
			height: 42%;
			animation-delay: -0.2s;
		}

		&:nth-child(2) {
			height: 100%;
			animation-delay: -0.5s;
		}

		&:nth-child(3) {
			height: 66%;
			animation-delay: -0.35s;
		}
	}
}

.vp-meting__cover-eq .vp-meting__eq,
.vp-meting__cover-eq i {
	color: #fff;
	background: #fff;
}

.vp-meting__cover-eq .vp-meting__eq {
	background: transparent;
}

.vp-meting__body {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	gap: 9px;
	min-width: 0;
}

.vp-meting__titles {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.vp-meting__title {
	display: -webkit-box;
	overflow: hidden;
	color: var(--vp-c-text, #3c3c43);
	font-size: clamp(1.08rem, 1.45vw, 1.4rem);
	font-weight: 700;
	line-height: 1.28;
	letter-spacing: -0.01em;
	overflow-wrap: anywhere;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
}

.vp-meting__artist {
	overflow: hidden;
	color: var(--vp-c-text-mute, rgb(60 60 67 / 78%));
	font-size: 0.85rem;
	line-height: 1.45;
	white-space: nowrap;
	text-overflow: ellipsis;

	&.is-error {
		color: var(--vp-c-red-text, #b8272c);
	}
}

.vp-meting__progress {
	display: flex;
	flex-direction: column;
	gap: 0;
	min-width: 0;
}

.vp-meting__slider {
	--mp-thumb: 12px;
	--mp-thumb-half: 6px;

	position: relative;
	display: flex;
	align-items: center;
	width: 100%;
	height: 18px;

	&.is-disabled {
		opacity: 0.55;
	}

	&:focus-within {
		border-radius: 999px;
		outline: 2px solid var(--mp-accent);
		outline-offset: 4px;
	}
}

.vp-meting__slider-rail,
.vp-meting__slider-fill {
	position: absolute;
	top: 50%;
	height: 4px;
	border-radius: 999px;
	transform: translateY(-50%);
	pointer-events: none;
}

.vp-meting__slider-rail {
	right: 0;
	left: 0;
	background: var(--vp-c-control-hover, rgb(142 150 170 / 16%));
}

.vp-meting__slider-fill {
	left: 0;
	width: calc(var(--mp-ratio, 0) * (100% - var(--mp-thumb-half)));
	background: var(--mp-accent);
	transition: width 0.1s linear;
}

.vp-meting__slider-thumb {
	position: absolute;
	top: 50%;
	left: calc(var(--mp-thumb-half) + (100% - var(--mp-thumb)) * var(--mp-ratio, 0));
	width: var(--mp-thumb);
	height: var(--mp-thumb);
	background: var(--vp-c-bg-elv, #fff);
	border: 2px solid var(--mp-accent);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	pointer-events: none;
	transition:
		left 0.1s linear,
		transform 0.15s ease;
}

.vp-meting__slider:hover .vp-meting__slider-thumb {
	transform: translate(-50%, -50%) scale(1.12);
}

.vp-meting__range {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	margin: 0;
	padding: 0;
	cursor: pointer;
	background: transparent;
	opacity: 0;
	appearance: none;

	&:disabled {
		cursor: default;
	}
}

.vp-meting__times {
	display: flex;
	justify-content: space-between;
	color: var(--vp-c-text-subtle, rgb(60 60 67 / 56%));
	font-size: 10.5px;
	font-variant-numeric: tabular-nums;
	line-height: 1.4;
	letter-spacing: 0.04em;
}

.vp-meting__controls {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	row-gap: 6px;
	align-items: center;
	min-width: 0;
}

.vp-meting__transport {
	display: flex;
	flex: none;
	gap: 6px;
	align-items: center;
}

.vp-meting__btn {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	color: var(--vp-c-text-mute, rgb(60 60 67 / 78%));
	cursor: pointer;
	background: transparent;
	border: none;
	border-radius: 50%;
	transition:
		color 0.2s ease,
		background 0.2s ease,
		transform 0.15s ease;

	svg {
		width: 19px;
		height: 19px;
	}

	&:hover {
		color: var(--vp-c-text, #3c3c43);
		background: var(--vp-c-control, rgb(142 150 170 / 10%));
	}

	&:active {
		transform: scale(0.92);
	}

	&:focus-visible {
		outline: 2px solid var(--mp-accent);
		outline-offset: 2px;
	}

	&:disabled {
		cursor: default;
		opacity: 0.4;
	}
}

.vp-meting__play {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	padding: 0;
	color: #fff;
	cursor: pointer;
	background: var(--mp-accent);
	border: none;
	border-radius: 50%;
	transition:
		background 0.18s ease,
		transform 0.18s ease;

	svg {
		width: 23px;
		height: 23px;
	}

	&:hover:not(:disabled) {
		background: var(--mp-accent-strong);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:focus-visible {
		outline: 2px solid var(--mp-accent);
		outline-offset: 3px;
	}

	&:disabled {
		cursor: default;
		opacity: 0.75;
	}
}

.vp-meting__spinner {
	animation: vp-meting-spin 0.9s linear infinite;
}

.vp-meting__volume {
	display: flex;
	flex: none;
	gap: 1px;
	align-items: center;
	margin-left: 2px;
}

.vp-meting__volume-btn {
	width: 32px;
	height: 32px;

	svg {
		width: 18px;
		height: 18px;
	}
}

.vp-meting__slider--volume {
	--mp-thumb: 10px;
	--mp-thumb-half: 5px;

	width: 62px;
	height: 16px;
}

.vp-meting__slider--volume .vp-meting__slider-rail,
.vp-meting__slider--volume .vp-meting__slider-fill {
	height: 3px;
}

.vp-meting__actions {
	display: flex;
	flex: none;
	gap: 4px;
	align-items: center;
	margin-left: auto;
}

.vp-meting__action {
	display: inline-flex;
	gap: 5px;
	align-items: center;
	justify-content: center;
	height: 32px;
	padding: 0 10px;
	color: var(--vp-c-text-mute, rgb(60 60 67 / 78%));
	font-size: 12px;
	font-weight: 600;
	line-height: 1;
	cursor: pointer;
	background: transparent;
	border: 1px solid transparent;
	border-radius: 999px;
	transition:
		color 0.2s ease,
		background 0.2s ease,
		border-color 0.2s ease;

	svg {
		width: 17px;
		height: 17px;
	}

	&:hover {
		color: var(--vp-c-text, #3c3c43);
		background: var(--vp-c-control, rgb(142 150 170 / 10%));
	}

	&:focus-visible {
		outline: 2px solid var(--mp-accent);
		outline-offset: 2px;
	}

	&.is-active {
		color: var(--mp-accent);
		background: var(--vp-c-accent-soft, rgb(20 111 184 / 14%));
	}
}

.vp-meting__action-count {
	min-width: 16px;
	padding: 1px 4px;
	color: inherit;
	font-size: 10px;
	font-variant-numeric: tabular-nums;
	line-height: 1.4;
	text-align: center;
	background: var(--vp-c-control, rgb(142 150 170 / 10%));
	border-radius: 999px;
}

.vp-meting__action-label {
	white-space: nowrap;
}

.vp-meting__panel {
	position: relative;
	z-index: 1;
	display: grid;
	grid-template-rows: 0fr;
	border-top: 0 solid var(--vp-c-divider, #e2e2e3);
	transition: grid-template-rows 0.32s cubic-bezier(0.2, 0.75, 0.25, 1);

	&.is-open {
		border-top-width: 1px;
		grid-template-rows: 1fr;
	}
}

.vp-meting__panel-inner {
	min-height: 0;
	overflow: hidden;
}

.vp-meting__panel-body {
	padding: 8px 16px 14px;
}

.vp-meting__lyrics {
	position: relative;
	max-height: 156px;
	padding: 8px 0;
	overflow-y: auto;
	scrollbar-color: var(--vp-c-control-hover, rgb(142 150 170 / 16%)) transparent;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		width: 5px;
	}

	&::-webkit-scrollbar-thumb {
		background: var(--vp-c-control-hover, rgb(142 150 170 / 16%));
		border-radius: 999px;
	}
}

.vp-meting__lyric {
	display: block;
	width: 100%;
	padding: 5px 10px;
	overflow: hidden;
	color: var(--vp-c-text-subtle, rgb(60 60 67 / 56%));
	font-size: 0.84rem;
	line-height: 1.5;
	text-align: center;
	text-overflow: ellipsis;
	white-space: nowrap;
	cursor: pointer;
	background: transparent;
	border: none;
	border-radius: 8px;
	opacity: 0.75;
	transition:
		color 0.2s ease,
		transform 0.2s ease,
		opacity 0.2s ease;

	&:hover {
		color: var(--vp-c-text-mute, rgb(60 60 67 / 78%));
		background: var(--vp-c-control, rgb(142 150 170 / 10%));
		opacity: 1;
	}

	&.is-active {
		color: var(--mp-accent);
		font-weight: 700;
		opacity: 1;
	}
}

.vp-meting__lyrics-empty {
	padding: 26px 0;
	color: var(--vp-c-text-subtle, rgb(60 60 67 / 56%));
	font-size: 0.82rem;
	text-align: center;
}

.vp-meting__list {
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 1px;
	padding-right: 2px;
	overflow-y: auto;
	scrollbar-color: var(--vp-c-control-hover, rgb(142 150 170 / 16%)) transparent;
	scrollbar-width: thin;

	&::-webkit-scrollbar {
		width: 5px;
	}

	&::-webkit-scrollbar-thumb {
		background: var(--vp-c-control-hover, rgb(142 150 170 / 16%));
		border-radius: 999px;
	}
}

.vp-meting__list-item {
	min-width: 0;
}

.vp-meting__track {
	display: flex;
	gap: 10px;
	align-items: center;
	width: 100%;
	padding: 6px 8px;
	color: inherit;
	text-align: left;
	cursor: pointer;
	background: transparent;
	border: none;
	border-radius: 10px;
	transition: background 0.18s ease;

	&:hover {
		background: var(--vp-c-control, rgb(142 150 170 / 10%));
	}

	&:focus-visible {
		outline: 2px solid var(--mp-accent);
		outline-offset: -2px;
	}

	&.is-active {
		background: var(--vp-c-accent-soft, rgb(20 111 184 / 14%));
	}
}

.vp-meting__track-index {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	width: 22px;
	color: var(--vp-c-text-subtle, rgb(60 60 67 / 56%));
	font-size: 11px;
	font-variant-numeric: tabular-nums;
	text-align: center;
}

.vp-meting__track.is-active .vp-meting__track-index {
	color: var(--mp-accent);
}

.vp-meting__track-meta {
	display: flex;
	flex: 1 1 auto;
	flex-direction: column;
	gap: 1px;
	min-width: 0;
}

.vp-meting__track-name {
	overflow: hidden;
	color: var(--vp-c-text, #3c3c43);
	font-size: 0.86rem;
	font-weight: 600;
	line-height: 1.35;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.vp-meting__track.is-active .vp-meting__track-name {
	color: var(--mp-accent);
}

.vp-meting__track-artist {
	overflow: hidden;
	color: var(--vp-c-text-mute, rgb(60 60 67 / 78%));
	font-size: 0.74rem;
	line-height: 1.3;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.vp-meting__audio {
	display: none;
}

@keyframes vp-meting-eq {
	0%,
	100% {
		transform: scaleY(0.35);
	}

	50% {
		transform: scaleY(1);
	}
}

@keyframes vp-meting-spin {
	to {
		transform: rotate(360deg);
	}
}

/* 中屏：先收起音量滑杆，再收起动作文字，最后隐藏列表数量。
   卡片宽度由正文列决定，用容器查询而不是视口宽度判断。 */
@container vp-meting (max-width: 700px) {
	.vp-meting__slider--volume {
		display: none;
	}
}

@container vp-meting (max-width: 620px) {
	.vp-meting__action {
		width: auto;
		min-width: 34px;
		padding: 0 8px;
	}

	.vp-meting__action-label {
		display: none;
	}
}

@container vp-meting (max-width: 560px) {
	.vp-meting__action-count {
		display: none;
	}
}

@container vp-meting (max-width: 520px) {
	.vp-meting__volume {
		display: none;
	}
}

@media (max-width: 720px) {
	.vp-meting {
		--mp-radius: 16px;
		--mp-cover-size: 96px;

		margin: 1.25rem 0;
	}

	.vp-meting__main {
		gap: 14px;
		padding: 14px;
	}

	.vp-meting__body {
		gap: 8px;
	}

	.vp-meting__title {
		font-size: 1.02rem;
	}

	.vp-meting__volume {
		display: none;
	}

	.vp-meting__action {
		width: auto;
		min-width: 34px;
		padding: 0 8px;
	}

	.vp-meting__action-label {
		display: none;
	}

	.vp-meting__play {
		width: 46px;
		height: 46px;

		svg {
			width: 21px;
			height: 21px;
		}
	}

	.vp-meting__btn {
		width: 32px;
		height: 32px;
	}

	.vp-meting__panel-body {
		padding: 8px 12px 12px;
	}

	.vp-meting__lyrics {
		max-height: 132px;
	}
}

@media (max-width: 420px) {
	.vp-meting {
		--mp-cover-size: 88px;
	}

	.vp-meting__main {
		gap: 12px;
		padding: 12px;
	}

	.vp-meting__transport {
		gap: 2px;
	}

	.vp-meting__controls {
		gap: 6px;
	}

}

@media (prefers-reduced-motion: reduce) {
	.vp-meting *,
	.vp-meting *::before,
	.vp-meting *::after {
		animation: none !important;
		transition: none !important;
		scroll-behavior: auto !important;
	}
}
</style>
