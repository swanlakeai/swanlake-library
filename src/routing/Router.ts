export class Router {
	private static _microservices(): Map<string, string> {
		const keyValuePairs = process.env.API_VERSIONS.split(";").filter(Boolean);

		const result = new Map<string, string>();

		for (const pair of keyValuePairs) {
			const [key, value] = pair.split(":");
			if (key && value) {
				result.set(key, value);
			}
		}

		return result;
	}

	static getUrl(microservice?: string) {
		const url: string = process.env.API_URL;
		if (!microservice) return url;

		const versions: Map<string, string> = this._microservices();
		return `${url}v${versions.get(microservice)}/`;
	}
}
