import fs from "fs";
import path from "path";
import ts from "typescript";

// ...existing code...

/**
 * Maps TypeScript types to OpenAPI types.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @returns {object} - The OpenAPI type definition.
 */
function mapTsTypeToOpenAPIType(typeNode) {
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
      return { type: "string" };
    case ts.SyntaxKind.NumberKeyword:
      return { type: "number" };
    case ts.SyntaxKind.BooleanKeyword:
      return { type: "boolean" };
    case ts.SyntaxKind.ArrayType:
      return {
        type: "array",
        items: mapTsTypeToOpenAPIType(typeNode.elementType),
      };
    default:
      return { type: "object" }; // Default fallback
  }
}

/**
 * Converts all TypeScript interface definitions in a directory into OpenAPI schemas.
 * @param {string} dirPath - The path to the directory containing TypeScript files.
 * @returns {object} - An object mapping file names to their OpenAPI schemas.
 */
function convertDirectoryToOpenAPISchemas(dirPath) {
  const schema = {
    swagger: "2.0",
    info: {
      title: "api",
      version: "1.0.0",
    },
    produces: ["application/json"],
    paths: {},
    definitions: {},
    tags: [], // Initialize tags array
  };

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".ts"));
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Extract file-level JSDoc description for tags
    const { description } = extractFileJsDocDescription(fileContent);
    const tagName = path.basename(file, ".ts");
    schema.tags.push({
      name: tagName,
      description: description || `${tagName} related APIs`,
    });

    const definitions = convertDefinitions(fileContent, schema.definitions);
    schema.definitions = { ...schema.definitions, ...definitions };
  });
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");

    const paths = convertInterfaceToOpenAPISchema(
      fileContent,
      schema.definitions,
      file // Pass the file name
    );
    schema.paths = { ...schema.paths, ...paths };
  });

  return schema;
}

/**
 * Extracts file-level JSDoc description from a TypeScript file.
 * @param {string} fileContent - The content of the TypeScript file.
 * @returns {object} - An object containing `description`.
 */
function extractFileJsDocDescription(fileContent) {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  let description = "";

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isJSDoc(node)) {
      node.tags?.forEach((tag) => {
        if (tag.tagName.text === "description") {
          description = tag.comment || "";
        }
      });
    }
  });

  return { description };
}

/**
 * Converts a TypeScript file into OpenAPI schemas, including handling shared types in common.ts.
 * @param {string} interfaceCode - The TypeScript interface code as a string.
 * @returns {object} - The OpenAPI schema object with paths and definitions.
 */
function convertDefinitions(interfaceCode, definitions) {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    interfaceCode,
    ts.ScriptTarget.Latest,
    true
  );

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text;
      if (typeName === "Api") {
        return;
      }

      // Extract JSDoc for summary and description
      const { summary } = extractJsDocDescription(node);

      // Handle shared types in common.ts
      if (node.type && ts.isTypeLiteralNode(node.type)) {
        definitions[typeName] = {
          type: "object",
          properties: extractProperties(node.type, definitions),
          description: summary,
        };
      }
    } else if (ts.isEnumDeclaration(node)) {
      const enumName = node.name.text;

      // Extract JSDoc for summary and description
      const { summary } = extractJsDocDescription(node);

      // Handle enums
      const enumValues = [];
      node.members.forEach((member) => {
        if (member.initializer && ts.isStringLiteral(member.initializer)) {
          enumValues.push(member.initializer.text);
        }
      });

      definitions[enumName] = {
        type: "string",
        enum: enumValues,
        description: summary,
      };
    }
  });

  return definitions;
}
/**
 * Converts a TypeScript file into OpenAPI schemas, including handling shared types in common.ts.
 * @param {string} interfaceCode - The TypeScript interface code as a string.
 * @returns {object} - The OpenAPI schema object with paths and definitions.
 */
function convertInterfaceToOpenAPISchema(interfaceCode, definitions, fileName) {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    interfaceCode,
    ts.ScriptTarget.Latest,
    true
  );
  const paths = {};

  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      const typeName = node.name.text;
      if (typeName === "Api") {
        return;
      }

      // Extract JSDoc for summary and description
      const { summary, description } = extractJsDocDescription(node);

      // Handle shared types in common.ts
      if (node.type && ts.isTypeLiteralNode(node.type)) {
        return;
      }

      // Handle API definitions
      const typeLiteral = node.type;
      if (ts.isTypeReferenceNode(typeLiteral) && typeLiteral.typeArguments) {
        const apiDefinition = typeLiteral.typeArguments[0];
        if (ts.isTypeLiteralNode(apiDefinition)) {
          let url = "";
          let method = "";
          const pathItem = {
            summary, // Use extracted JSDoc summary
            description, // Use extracted JSDoc description
            produces: ["application/json"],
            parameters: [],
            responses: {},
            tags: [path.basename(fileName, ".ts")], // Use file name as tag
          };

          apiDefinition.members.forEach((member) => {
            if (ts.isPropertySignature(member) && member.name) {
              const propertyName = member.name.text;

              if (propertyName === "url") {
                url = extractLiteralValue(member.type);
              } else if (propertyName === "method") {
                method = extractLiteralValue(member.type).toLowerCase();
              } else if (propertyName === "paths") {
                pathItem.parameters = [
                  ...pathItem.parameters,
                  ...extractParameters(member.type, definitions, "path"),
                ];
              } else if (propertyName === "query") {
                pathItem.parameters = [
                  ...pathItem.parameters,
                  ...extractParameters(member.type, definitions, "query"),
                ];
              } else if (propertyName === "body") {
                const formDataParameters = extractParameters(
                  member.type,
                  definitions,
                  "formData"
                );
                pathItem.parameters = [
                  ...pathItem.parameters,
                  ...formDataParameters,
                ];

                // Add "consumes" property if "formData" parameters exist
                if (formDataParameters.length > 0) {
                  pathItem.consumes = [
                    "application/x-www-form-urlencoded",
                    "multipart/form-data",
                  ];
                }
              } else if (propertyName === "response") {
                const responses = extractResponse(member.type, definitions);
                Object.keys(responses).forEach((statusCode) => {
                  pathItem.responses[statusCode] = responses[statusCode];
                });
              }
            }
          });

          if (url && method) {
            if (!paths[url]) {
              paths[url] = {};
            }
            paths[url][method] = pathItem;
          }
        }
      }
    }
  });

  return paths;
}

/**
 * Extracts literal values from a TypeScript type node.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @returns {string} - The literal value.
 */
function extractLiteralValue(typeNode) {
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    return typeNode.literal.text;
  }
  return null;
}

/**
 * Extracts properties from a TypeScript type node.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @returns {object} - The extracted properties.
 */
function extractProperties(typeNode, definitions) {
  const properties = {};
  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const propertyName = member.name.text;

        // Extract JSDoc for default value
        const { default: defaultValue } = extractJsDocDescription(member);

        // Use resolveSharedType to handle both simple and complex types
        const resolvedType = resolveSharedType(member.type, definitions);

        properties[propertyName] = {
          ...(resolvedType.schema || resolvedType),
          ...(defaultValue !== undefined ? { default: defaultValue } : {}),
        };
      }
    });
  }
  return properties;
}

/**
 * Extracts response definitions from a TypeScript type node.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @param {object} sharedTypes - The shared types collected from common.ts.
 * @returns {object} - The extracted response definitions.
 */
function extractResponse(typeNode, sharedTypes) {
  const responses = {};
  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const statusCode = member.name.text;

        // Extract JSDoc for default value
        const { default: defaultValue } = extractJsDocDescription(member);

        const responseType = resolveSharedType(member.type, sharedTypes);

        responses[statusCode] = {
          ...responseType,
          ...(defaultValue !== undefined ? { default: defaultValue } : {}),
        };
      }
    });
  }
  return responses;
}

/**
 * Extracts parameters from a TypeScript type node for OpenAPI paths.
 * For simple types, it uses `"type"`. For complex types, it uses `"schema"`.
 * Also handles `body` properties and parses them into OpenAPI `parameters`.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @returns {array} - The extracted parameters.
 */
function extractParameters(typeNode, sharedTypes, type) {
  const parameters = [];
  if (ts.isTypeLiteralNode(typeNode)) {
    typeNode.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const propertyName = member.name.text;

        // Extract JSDoc for default value
        const { default: defaultValue } = extractJsDocDescription(member);

        const resolvedType = resolveSharedType(member.type, sharedTypes);

        // Determine if the property is required
        const isRequired = type === "path" ? true : !member.questionToken;

        parameters.push({
          name: propertyName,
          in: type,
          required: isRequired, // Dynamically set required based on questionToken
          ...(resolvedType.schema
            ? { schema: resolvedType.schema } // Use `schema` for complex types
            : resolvedType), // Use `type` directly for simple types
          ...(defaultValue !== undefined ? { default: defaultValue } : {}),
          description: member.jsDoc?.[0]?.comment || "", // Extract description from JSDoc
        });
      }
    });
  }
  return parameters;
}

/**
 * Resolves shared types from common.ts or inline definitions.
 * For simple types, it returns a direct `type`. For complex types, it uses `schema`.
 * Handles `Omit` types and indexed access types like `User["sex"]`.
 * @param {ts.TypeNode} typeNode - The TypeScript type node.
 * @param {object} sharedTypes - The shared types collected from common.ts.
 * @returns {object} - The resolved schema or type.
 */
function resolveSharedType(typeNode, sharedTypes) {
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = resolveTypeName(typeNode.typeName);

    // Handle enums and shared types
    if (sharedTypes[typeName]) {
      const sharedType = sharedTypes[typeName];

      // Check if the shared type is an enum
      if (sharedType.type === "string" && Array.isArray(sharedType.enum)) {
        return {
          description: sharedType.description || "Enum type reference",
          schema: {
            type: "string",
            enum: sharedType.enum,
          },
        };
      }

      // Handle other shared types
      return {
        description: "Shared type reference",
        schema: {
          $ref: `#/definitions/${typeName}`,
        },
      };
    }

    // Handle Omit types
    if (typeName === "Omit") {
      if (!typeNode.typeArguments || typeNode.typeArguments.length !== 2) {
        return { type: "object" }; // Fallback to a generic object type
      }

      const baseType = typeNode.typeArguments[0];
      const keysToOmit = typeNode.typeArguments[1];

      if (
        ts.isTypeReferenceNode(baseType) &&
        ts.isLiteralTypeNode(keysToOmit)
      ) {
        const baseTypeName = resolveTypeName(baseType.typeName);
        const keyToOmit = keysToOmit.literal.text;

        if (sharedTypes[baseTypeName]) {
          const newTypeName = `${baseTypeName}Without${capitalize(keyToOmit)}`;
          if (!sharedTypes[newTypeName]) {
            const baseDefinition = sharedTypes[baseTypeName];
            const newDefinition = {
              ...baseDefinition,
              properties: { ...baseDefinition.properties },
            };
            delete newDefinition.properties[keyToOmit];
            sharedTypes[newTypeName] = {
              ...newDefinition,
              description: `Omit type based on ${baseTypeName} without ${keyToOmit}`,
            };
          }
          return {
            schema: {
              $ref: `#/definitions/${newTypeName}`,
            },
          };
        } else {
          console.error(`Base type ${baseTypeName} not found in sharedTypes.`);
        }
      } else {
        console.error("Invalid Omit type arguments.");
      }
    }
  }

  // Handle indexed access types like User["sex"]
  if (ts.isIndexedAccessTypeNode(typeNode)) {
    const objectType = resolveSharedType(typeNode.objectType, sharedTypes);
    const indexType = typeNode.indexType;

    if (
      ts.isLiteralTypeNode(indexType) &&
      ts.isStringLiteral(indexType.literal)
    ) {
      const propertyName = indexType.literal.text;

      if (objectType.schema && objectType.schema.$ref) {
        const refName = objectType.schema.$ref.replace("#/definitions/", "");
        const referencedType = sharedTypes[refName];

        if (
          referencedType &&
          referencedType.properties &&
          referencedType.properties[propertyName]
        ) {
          return referencedType.properties[propertyName];
        }
      }
    }
  }

  if (ts.SyntaxKind[typeNode.kind] === "TypeLiteral") {
    // Handle inline type definitions
    const properties = {};
    typeNode.members.forEach((member) => {
      if (ts.isPropertySignature(member) && member.name) {
        const propertyName = member.name.text;
        const resolvedType = resolveSharedType(member.type, sharedTypes);

        properties[propertyName] = resolvedType.schema || resolvedType;
      }
    });

    return {
      description: "Inline type definition",
      schema: {
        type: "object",
        properties,
      },
    };
  }

  const simpleType = mapTsTypeToOpenAPIType(typeNode);
  if (simpleType.type !== "object") {
    return simpleType; // Return simple type directly
  }

  return {
    description: "Complex type",
    schema: simpleType, // Wrap complex types in `schema`
  };
}

/**
 * Resolves the name of a TypeScript type node to a string.
 * Handles cases where the type name is a QualifiedName or Identifier.
 * @param {ts.EntityName} typeNameNode - The type name node.
 * @returns {string} - The resolved type name as a string.
 */
function resolveTypeName(typeNameNode) {
  if (ts.isIdentifier(typeNameNode)) {
    return typeNameNode.text;
  } else if (ts.isQualifiedName(typeNameNode)) {
    return resolveTypeName(typeNameNode.left) + "." + typeNameNode.right.text;
  }
  return "";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extracts JSDoc summary, description, and default value from a TypeScript node.
 * @param {ts.Node} node - The TypeScript node.
 * @returns {object} - An object containing `summary`, `description`, and `default`.
 */
function extractJsDocDescription(node) {
  const jsDoc = node.jsDoc && node.jsDoc[0];
  if (!jsDoc) return { summary: "", description: "", default: undefined };

  const summary = jsDoc.comment || "";
  let description = "";
  let defaultValue;

  if (jsDoc.tags) {
    jsDoc.tags.forEach((tag) => {
      if (tag.tagName.text === "description") {
        description = tag.comment || "";
      } else if (tag.tagName.text === "default") {
        defaultValue = tag.comment || undefined;
      }
    });
  }

  return { summary, description, default: defaultValue };
}

const schemas = convertDirectoryToOpenAPISchemas("./define");
fs.writeFileSync("./schema.json", JSON.stringify(schemas, null, 2));
