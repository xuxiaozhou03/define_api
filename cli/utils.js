import * as ts from "typescript";

function extractCommentInfo(comment) {
  const commentObj = comment
    .replace("/**", "")
    .replace("*/", "")
    .trim()
    .split("\n")
    .reduce((prev, line) => {
      const value = line.replace("* ", "").trim();
      if (value.includes("@")) {
        const [key, val] = value.split(" ");
        return { ...prev, [key.replace("@", "")]: val };
      }

      return {
        ...prev,
        title: prev.title ? `${prev.title} ${value}` : value,
      };
    }, {});
  return commentObj;
}

export function getComments(node, sourceFile) {
  const leadingComments =
    ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos) || [];
  const trailingComments =
    ts.getTrailingCommentRanges(sourceFile.getFullText(), node.end) || [];

  const comments = [...leadingComments, ...trailingComments].map((comment) =>
    sourceFile.getFullText().slice(comment.pos, comment.end).trim()
  );

  if (comments.length === 0) {
    return undefined;
  }
  if (comments.length === 1) {
    return extractCommentInfo(comments[0]);
  }
  console.warn("more comments");
  return null;
}
