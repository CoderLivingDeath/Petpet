import { decodeFrames, encode } from "modern-gif";

export const context = {
	image: null,
	gif_url: "/pat-pat-pet-pet.gif",
	speed: 1,
	defaultSpeed: 1,
	minDelay: 20,
};

async function LoadFile(url) {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`HTTP error: ${response.status}`);
	}

	return response.arrayBuffer();
}

async function LoadImage(source) {
	if (typeof source === "string") {
		const response = await fetch(source);

		if (!response.ok) {
			throw new Error(`HTTP error: ${response.status}`);
		}

		return createImageBitmap(await response.blob());
	}

	if (source instanceof Blob) {
		return createImageBitmap(source);
	}

	return source;
}

function drawCover(ctx, source, width, height) {
	const sourceWidth = source.width ?? source.naturalWidth;
	const sourceHeight = source.height ?? source.naturalHeight;

	if (!sourceWidth || !sourceHeight) {
		throw new Error("Image has no dimensions");
	}

	const scale = Math.max(width / sourceWidth, height / sourceHeight);
	const drawWidth = sourceWidth * scale;
	const drawHeight = sourceHeight * scale;

	ctx.drawImage(
		source,
		(width - drawWidth) / 2,
		(height - drawHeight) / 2,
		drawWidth,
		drawHeight,
	);
}

function renderBase(source, width, height) {
	const canvas = new OffscreenCanvas(width, height);
	const ctx = canvas.getContext("2d", {
		willReadFrequently: true,
	});

	if (!ctx) {
		throw new Error("Could not create 2D canvas context");
	}

	drawCover(ctx, source, width, height);

	return ctx.getImageData(0, 0, width, height).data;
}

export async function Composite(settings) {
	const { image, gif_url, speed, defaultSpeed, minDelay } = settings;

	if (!image) {
		throw new Error("Image is not selected");
	}

	const [source, gifBuffer] = await Promise.all([
		LoadImage(image),
		LoadFile(gif_url),
	]);

	const decodedFrames = decodeFrames(gifBuffer);

	if (!decodedFrames.length) {
		throw new Error("GIF contains no frames");
	}

	const { width, height } = decodedFrames[0];
	const base = renderBase(source, width, height);

	return {
		width,
		height,
		frames: decodedFrames.map((frame) =>
			CompositeFrame(frame, base, {
				speed,
				defaultSpeed,
				minDelay,
			}),
		),
	};
}

export async function CompositeGif(settings) {
	const { width, height, frames } = await Composite(settings);

	return encode({
		width,
		height,
		frames,
		format: "blob",
	});
}

export function CompositeFrame(frame, base, settings) {
	const { data, delay } = frame;

	if (data.length !== base.length) {
		throw new Error("Frame and base image dimensions do not match");
	}

	const out = new Uint8ClampedArray(data.length);

	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3] / 255;
		const rest = 1 - alpha;

		out[i] = data[i] * alpha + base[i] * rest;
		out[i + 1] = data[i + 1] * alpha + base[i + 1] * rest;
		out[i + 2] = data[i + 2] * alpha + base[i + 2] * rest;
		out[i + 3] = 255;
	}

	const speed = settings.speed > 0 ? settings.speed : 1;
	const defaultSpeed = settings.defaultSpeed > 0 ? settings.defaultSpeed : 1;
	const minDelay = settings.minDelay ?? 20;

	return {
		data: out,
		delay: Math.max(minDelay, Math.round((delay * defaultSpeed) / speed)),
	};
}
