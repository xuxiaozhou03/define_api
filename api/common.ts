export type Api<
  T extends {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    paths?: Record<string, string | number>;
    params?: Record<string, string | number>;
    body?: Record<string, unknown>;
    response: {
      200?: any;
      201?: any;
      204?: any;
      404?: any;
    };
  }
> = {
  url: T["url"];
  method: T["method"];
  paths: T["paths"];
  params: T["params"];
  body: T["body"];
  response: T["response"];
};

/**
 * 性别枚举
 */
enum Sex {
  /**
   * 男
   */
  Man = "man",
  /**
   * 女
   */
  Woman = "woman",
}

export type User = {
  /**
   * id
   * @default 2
   */
  id: string;
  /**
   * 姓名
   */
  name: string;
  /**
   * 性别
   */
  sex: Sex;
};
