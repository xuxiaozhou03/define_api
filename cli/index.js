import * as ts from "typescript";
import fs from "fs";

// 获取api目录下的所有文件
const apiDir = "./api";
const filePaths = fs.readdirSync(apiDir).map((file) => `${apiDir}/${file}`);

const sourceFiles = filePaths.map((filePath) =>
  ts.createSourceFile(
    filePath,
    ts.sys.readFile(filePath) || "",
    ts.ScriptTarget.Latest
  )
);

function getComments(node, sourceFile) {
  const leadingComments =
    ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos) || [];
  const trailingComments =
    ts.getTrailingCommentRanges(sourceFile.getFullText(), node.end) || [];

  const comments = [...leadingComments, ...trailingComments].map((comment) =>
    sourceFile.getFullText().slice(comment.pos, comment.end).trim()
  );

  return comments;
}

// Function to traverse the AST
function traverseAST(node, sourceFile) {
  const kind = ts.SyntaxKind[node.kind];

  const nodeData = {
    kind,
    text: node.getText(sourceFile),
    comments: getComments(node, sourceFile),
    children: [], // Nested array for child nodes
  };

  ts.forEachChild(node, (child) => {
    nodeData.children.push(traverseAST(child, sourceFile)); // Recursively add child nodes
  });

  return nodeData;
}

// Traverse all source files and combine their ASTs
const astTrees = sourceFiles.map((sourceFile) =>
  traverseAST(sourceFile, sourceFile)
);

// Output the combined structure
fs.writeFileSync("./ast.json", JSON.stringify(astTrees, null, 2));
