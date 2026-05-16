type RequestInterceptor = (options: RequestInit) => RequestInit;
type ResponseInterceptor = (response: Response) => Response;

class CustomFetcher {
  private requestInterceptor: Array<RequestInterceptor>;
  private responseInterceptor: Array<ResponseInterceptor>;

  constructor() {
    this.requestInterceptor = [];
    this.responseInterceptor = [];
  }

  setRequestInterceptor(interceptor: RequestInterceptor) {
    this.requestInterceptor.push(interceptor);
  }

  setResponseInterceptor(interceptor: ResponseInterceptor) {
    this.responseInterceptor.push(interceptor);
  }

  async fetchApi(url: string, options: RequestInit): Promise<Response> {
    let response: Response;
    let requestOptions = options;

    for (const interceptor of this.requestInterceptor) {
      requestOptions = interceptor(requestOptions);
    }

    try {
      response = await fetch(url, requestOptions);

      for (const interceptor of this.responseInterceptor) {
        response = interceptor(response);
      }

      return response;
    } catch (error) {
      throw error
    }
  }
}

let initialCustomFetcher: CustomFetcher;

const getCustomFetcher = () => {
  if (!initialCustomFetcher) {
    initialCustomFetcher = new CustomFetcher();
  }

  return initialCustomFetcher;
}

export const customFetcher = getCustomFetcher();