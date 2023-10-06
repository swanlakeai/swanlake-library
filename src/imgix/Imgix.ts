import ImgixClient from "@imgix/js-core";

export class Imgix {
	private _client: ImgixClient;

	constructor(domain: string, token: string) {
		this._client = new ImgixClient({
			domain: domain,
			secureURLToken: token,
		});
	}

	buildURL(path: string, params: any) {
		return this._client.buildURL(path, params);
	}
}
