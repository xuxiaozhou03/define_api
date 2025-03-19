type BaseApi<
  T extends {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    paths?: Record<string, string> | undefined;
    params: {};
    body: {};
    response: {};
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

type User = {
  /**
   * id
   * @default "2"
   */
  id: string;
  // 姓名
  name: string;
  /**
   * 性别
   */
  sex: Sex;
};

/**
 * Get user by id
 */
type GetUserById = BaseApi<{
  url: "/users/{userId}";
  method: "GET";
  paths: {
    /**
     * 用户id
     */
    userId: string;
  };
  params: {
    /**
     * 用户名
     */
    name?: string;
  };
  body: {
    /**
     * 文件
     */
    file: FormData | string;
  };
  response: { 200: User };
}>;
