# define_api

> 接口定义作为项目挺重要的环节，可视化工具对程序员有点增加复杂度

> 直接撸代码，生成文档后对着文档开发更符合程序员体质

> 本项目都是通过 github copilot 生成代码，而且项目还处于特别早期阶段

## roadmap

1. 通过 typescript 定义接口
   1.1 缺少 query
2. 生成 openapi schema
   2.1 支持 Typescript 的更多泛型（目前支持 Omit）
   2.2 支持 枚举
   2.3 支持 数组等复杂类型
3. 生成文档
   3.1 xx
4. 生成前端接口定义（通过 swagger-typescript-api 轻松搞定）
5. 自动测试接口返回数据
6. 版本管理（git/或者 release）

## 效果

1. 定义接口到 openapi schema
   <img src="./docs/define2schema.png"/>
2. 生成前端代码
   <img src="./docs/ts.png"/>
3. 生成文档
   <img src="./docs/doc.png" />

## 定义接口

```typescript
import { User } from "./common";
import { Api } from "./helper";

/**
 * 获取用户
 */
export type GetUser = Api<{
  url: "/user/{userId}";
  method: "GET";
  paths: {
    /**
     * 用户id
     */
    userId: string;
  };
  response: { 200: User };
}>;
```

## 运行脚本

```shell
node cli.js
```

## 生成 openapi schema

```json
{
  "swagger": "2.0",
  "info": {
    "title": "api",
    "version": "1.0.0"
  },
  "produces": ["application/json"],
  "paths": {
    "/user/{userId}": {
      "get": {
        "summary": "获取用户",
        "description": "",
        "produces": ["application/json"],
        "parameters": [
          {
            "name": "userId",
            "in": "path",
            "required": true,
            "type": "string",
            "description": "用户id"
          },
          {
            "name": "name",
            "in": "path",
            "required": true,
            "type": "string",
            "description": "逗你玩"
          }
        ],
        "responses": {
          "200": {
            "description": "Shared type reference",
            "schema": {
              "$ref": "#/definitions/User"
            }
          }
        }
      }
    }
  },
  "definitions": {
    "Sex": {
      "type": "string",
      "enum": ["man", "woman"],
      "description": "性别枚举"
    },
    "User": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "sex": {
          "type": "string",
          "enum": ["man", "woman"]
        }
      },
      "description": ""
    },
    "UserWithoutId": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        },
        "sex": {
          "type": "string",
          "enum": ["man", "woman"]
        }
      },
      "description": "Omit type based on User without id"
    }
  }
}
```
