import * as TJS from "typescript-json-schema";

const program = TJS.getProgramFromFiles(["./type.ts"]);
const settings = {
  required: true,
  ignoreErrors: true,
  aliasRef: true,
  topRef: true,
  constAsEnum: false,
};

const schema = TJS.generateSchema(program, "GetUserById", settings);
console.log(JSON.stringify(schema, null, 2));
