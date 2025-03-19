# define_api

定义 api

1. [x] 通过 typescript 定义接口

```typescript
export type Api<
  T extends {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    paths?: Record<string, string> | undefined;
    params?: {};
    body?: {};
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
```

2. [ ] 生成 openapi schema
3. [ ] 生成文档
4. [ ] 生成前端接口定义
5. [ ] 自动测试接口返回数据
