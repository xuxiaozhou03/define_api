import { User } from "./common";
import { Api } from "./helper";

/**
 * 获取用户
 * @default 111
 */
export type GetUser = Api<{
  url: "/user/{userId}";
  method: "GET";
  paths: {
    /**
     * 用户id
     */
    userId: string;
    /**
     * 逗你玩
     */
    name?: string;
  };
  response: { 200: User };
}>;

/**
 * 创建用户
 */
export type CreateUser = Api<{
  url: "/users";
  method: "POST";
  body: {
    /**
     * 用户
     */
    user: Omit<User, "id">;
  };
  response: { 201: User };
}>;

/**
 * 更新用户
 */
export type UpdateUser = Api<{
  url: "/user/{userId}";
  method: "PUT";
  paths: {
    /**
     * 用户id
     */
    userId: string;
  };
  body: {
    /**
     * 用户
     */
    user: Omit<User, "id">;
  };
  response: { 201: User };
}>;

/**
 * 删除用户
 * @description 删除用户描述
 */
export type DeleteUser = Api<{
  url: "/user/{userId}";
  method: "DELETE";
  paths: {
    /**
     * 用户id
     */
    userId: string;
  };
  response: { 204: null };
}>;
