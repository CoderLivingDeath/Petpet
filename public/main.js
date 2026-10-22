import { CompositeGif, context } from "./petpet-logic.js";

const fileInput = document.querySelector("#fileinput");
const speedInput = document.querySelector("#input_speed");
const preview = document.querySelector("#gif-preview");

let image = null;
let previewUrl = null;
let renderTimer = null;
let renderId = 0;

async function render() {
	if (!image) {
		return;
	}

	const currentRender = ++renderId;

	try {
		const blob = await CompositeGif({ ...context, image });

		if (currentRender !== renderId) {
			return;
		}

		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		previewUrl = URL.createObjectURL(blob);
		preview.src = previewUrl;
	} catch (error) {
		console.error("Failed to generate gif", error);
	}
}

function scheduleRender() {
	window.clearTimeout(renderTimer);
	renderTimer = window.setTimeout(render, 150);
}

fileInput?.addEventListener("change", async () => {
	const [file] = fileInput.files ?? [];

	if (!file) {
		return;
	}

	try {
		image = await createImageBitmap(file);
		await render();
	} catch (error) {
		console.error("Failed to load image", error);
	}
});

speedInput?.addEventListener("change", () => {
	const value = Number(speedInput.value);

	if (Number.isFinite(value) && value > 0) {
		context.speed = value;
	}

	scheduleRender();
});
