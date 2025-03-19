import * as ts from "typescript";
import fs from "fs";
import { getComments } from "./utils.js";

// 获取api目录下的所有文件
const apiDir = "./api";
const filePaths = fs
  .readdirSync(apiDir)
  .filter((file) => file !== "helper.ts")
  .map((file) => `${apiDir}/${file}`);

const sourceFiles = filePaths.map((filePath) =>
  ts.createSourceFile(
    filePath,
    ts.sys.readFile(filePath) || "",
    ts.ScriptTarget.Latest
  )
);

function extractSimplifiedAST(node, sourceFile) {
  const kind = ts.SyntaxKind[node.kind];
  const simplifiedNode = {
    kind,
    text: node.getText(sourceFile),
    comments: getComments(node, sourceFile), // Include comments
    children: [],
  };

  ts.forEachChild(node, (child) => {
    simplifiedNode.children.push(extractSimplifiedAST(child, sourceFile));
  });

  return simplifiedNode;
}

// Extract simplified ASTs for all source files
const simplifiedASTs = sourceFiles.map((sourceFile) =>
  extractSimplifiedAST(sourceFile, sourceFile)
);

const parse = (ast) => {
  if (ast.kind === "EnumDeclaration") {
    return {
      kind: "EnumDeclaration",
      comments: ast.comments,
      identifier: ast.children.find((child) => child.kind === "Identifier")
        .text,
      members: ast.children
        .filter((child) => child.kind === "EnumMember")
        .map((child) => {
          return {
            comments: child.comments,
            identifier: child.children.find(
              (child) => child.kind === "Identifier"
            ).text,
            stringLiteral: child.children.find(
              (child) => child.kind === "StringLiteral"
            ).text,
          };
        }),
    };
  }

  if (ast.kind === "TypeAliasDeclaration") {
    return {
      comments: ast.comments,
      identifier: ast.children.find((child) => child.kind === "Identifier")
        .text,
    };
  }
  console.log();
};

const data = simplifiedASTs.map((simplifiedAST) => {
  return simplifiedAST.children.map(parse);
});
console.log(JSON.stringify(data, null, 2));
// Output the simplified ASTs
fs.writeFileSync(
  "./simplified_ast.json",
  JSON.stringify(simplifiedASTs, null, 2)
);
