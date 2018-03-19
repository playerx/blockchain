declare var document, navigator, module: any;

export function getPlatform() {
	if (typeof document != 'undefined') {
		return Platforms.Web
	}
	else if (typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
		return Platforms.ReactNative
	}
	else {
		return Platforms.Nodejs
	}
}

export enum Platforms {
	Web,
	Nodejs,
	ReactNative
}
