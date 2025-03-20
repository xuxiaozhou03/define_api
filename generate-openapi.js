import * as ts from "typescript";
import fs from "fs";
import { getComments } from "./cli/utils.js";

// 运行生成器
const fileContent = fs.readFileSync("./api/user.ts", "utf-8");
const source = ts.createSourceFile(
  "source.ts",
  fileContent,
  ts.ScriptTarget.Latest
);

// 准备 openapi schema
const openapiSchema = {
  openapi: "3.0.0",
  info: {
    title: "User API",
    version: "1.0.0",
  },
  paths: {},
  // 定义
  components: {
    schemas: {},
  },
};

function extractSimplifiedAST(node, sourceFile) {
  const kind = ts.SyntaxKind[node.kind];
  if (["EndOfFileToken", "ExportKeyword"].includes(kind)) {
    return null;
  }

  const simplifiedNode = {
    kind,
    text: [
      "SourceFile",
      "TypeAliasDeclaration",
      "PropertySignature",
      "TypeLiteral",
      "TypeReference",
      "ImportDeclaration",
      "ImportClause",
    ].includes(kind)
      ? undefined
      : node.getText(sourceFile),
    comments: getComments(node, sourceFile), // Include comments
    children: [],
  };

  if (kind === "LiteralType") {
    if (simplifiedNode.children.length === 0) {
      simplifiedNode.children = undefined;
    }
    return simplifiedNode;
  }

  ts.forEachChild(node, (child) => {
    const childNode = extractSimplifiedAST(child, sourceFile);
    if (childNode) {
      if (childNode.kind === "Identifier") {
        simplifiedNode.text = childNode.text;
        return;
      }
      if (childNode.kind === "TypeReference" && childNode.text === "Api") {
        simplifiedNode.children = childNode.children[0].children;
        simplifiedNode.kind = "API";
        return;
      }

      if (
        ["ImportSpecifier", "StringLiteral", "ExportKeyword"].includes(
          childNode.kind
        )
      ) {
        childNode.children = undefined;
      }
      if (childNode.kind === "NamedImports") {
        childNode.text = undefined;
      }

      simplifiedNode.children.push(childNode);
    }
  });

  return simplifiedNode;
}

// 遍历AST
const tree = extractSimplifiedAST(source, source);

fs.writeFileSync("./ast.json", JSON.stringify(tree, null, 2));
