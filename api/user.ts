import { Api, User } from "./common";

/**
 * 获取用户
 */
export type GetUser = Api<{
  url: "/users/{userId}";
  method: "GET";
  paths: {
    /**
     * 用户id
     */
    userId: string;
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
