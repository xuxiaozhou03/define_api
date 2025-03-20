# dapi

`dapi` 是一个基于 TypeScript 的接口定义工具，支持从接口定义生成 OpenAPI Schema、前端代码和文档。

## 特性

- **接口定义**：使用 TypeScript 定义接口，支持泛型、枚举、复杂类型等。
- **Schema 生成**：从接口定义生成 OpenAPI Schema。
- **代码生成**：通过 `swagger-typescript-api` 生成前端接口代码。
- **文档生成**：自动生成接口文档。
- **自动化测试**：支持接口返回数据的自动化测试。
- **版本管理**：通过 Git 或 Release 管理接口版本。

## 使用方法

### 生成 OpenAPI Schema

```shell
node cli.js
```

### 生成前端代码

```shell
npx swagger-typescript-api -p ./schema.json -o ./result
```

## 示例

### 定义接口

```typescript
import { User } from "./common";
import { Api } from "./helper";

/**
 * 获取用户信息
 */
export type GetUser = Api<{
  url: "/user/{userId}";
  method: "GET";
  paths: {
    /**
     * 用户 ID
     */
    userId: string;
  };
  response: { 200: User };
}>;
```

### 生成的 OpenAPI Schema

```json
{
  "swagger": "2.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  },
  "paths": {
    "/user/{userId}": {
      "get": {
        "summary": "获取用户信息",
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string",
            "description": "用户 ID"
          }
        ],
        "responses": {
          "200": {
            "description": "用户信息",
            "schema": {
              "$ref": "#/definitions/User"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "User": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string" },
        "sex": { "type": "string", "enum": ["man", "woman"] }
      },
      "description": "用户信息"
    }
  }
}
```

## Roadmap

- 增强 TypeScript 泛型支持
- 支持更多复杂类型（如数组、嵌套对象）
- 完善文档生成功能
- 增加自动化测试和版本管理功能
