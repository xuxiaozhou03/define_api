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
