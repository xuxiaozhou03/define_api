export type Api<
  T extends {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    paths?: Required<Record<string, string | number>>;
    query?: Record<string, string | number>;
    params?: Record<string, string | number>;
    body?: Record<string, unknown>;
    response: {
      200?: any;
      201?: any;
      204?: any;
      404?: any;
    };
  },
> = {
  url: T["url"];
  method: T["method"];
  paths: T["paths"];
  params: T["params"];
  query: T["query"];
  body: T["body"];
  response: T["response"];
};
