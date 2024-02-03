/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
module.exports = grammar({
  name: "rules",

  extras: ($) => [/\s/, $.comment],

  precedences: ($) => [
    [
      "member",
      "subscript",
      "call",
      "unary_void",
      "binary_times",
      "binary_plus",
      "binary_relation",
      "binary_equality",
      "and",
      "or",
      "ternary",
    ],
  ],

  rules: {
    source_file: ($) =>
      seq(
        field("version", optional($.rules_version_statement)),
        repeat(field("service", $.service_declaration))
      ),

    rules_version_statement: ($) =>
      seq("rules_version", "=", field("version", $.string), optional(";")),

    service_name_identifier: ($) => /[^\s]+/,

    service_declaration: ($) =>
      seq(
        "service",
        field("name", $.service_name_identifier),
        "{",
        repeat(
          choice(
            field("function", $.function_declaration),
            field("match", $.match_declaration)
          )
        ),
        "}"
      ),

    function_declaration: ($) =>
      seq(
        "function",
        field("name", $.identifier),
        field("argument", $.function_argument),
        "{",
        field("body", $.function_body),
        "}"
      ),

    function_argument: ($) =>
      seq(
        "(",
        optional(
          seq(
            field("arg", $.identifier),
            repeat(seq(",", field("arg", $.identifier)))
          )
        ),
        ")"
      ),

    function_body: ($) =>
      seq(
        repeat(field("statement", $._statement)),
        field("return", $.return_statement)
      ),

    return_statement: ($) =>
      seq("return", field("expression", $._expression), optional(";")),

    match_declaration: ($) =>
      seq(
        "match",
        field("path", $.match_path_parameter),
        "{",
        repeat1(
          choice(
            field("function", $.function_declaration),
            field("match", $.match_declaration),
            field("allow", $.allow_declaration)
          )
        ),
        "}"
      ),

    match_path_parameter: ($) =>
      repeat1(
        choice(
          $.path_string,
          $.path_capture_string,
          $.path_capture_group_string
        )
      ),

    path_identifier: ($) => /[a-zA-Z0-9_%\-~&'.:]+/, // TODO: misterias charset...

    path_string: ($) => seq("/", field("path", $.path_identifier)),

    path_capture_string: ($) =>
      seq("/", "{", field("value", $.identifier), "}"),

    path_capture_group_string: ($) =>
      seq("/", "{", field("value", $.identifier), "=**", "}"),

    allow_operation_literal: ($) =>
      choice("read", "get", "list", "write", "update", "delete", "create"),

    allow_declaration: ($) =>
      seq(
        "allow",
        field("operation", $.allow_operation_literal),
        repeat(seq(",", field("operation", $.allow_operation_literal))),
        ":",
        "if",
        field("expression", $._expression),
        optional(";")
      ),

    _statement: ($) => $.let_declaration,

    let_declaration: ($) =>
      seq(
        "let",
        field("name", $.identifier),
        "=",
        field("expression", $._expression),
        ";"
      ),

    _expression: ($) =>
      choice(
        $.literal,
        $.identifier,
        $._operator_expression,
        $.paran,
        $.member_expression,
        $.subscript_expression,
        $.function_call_expression
      ),

    literal: ($) =>
      choice(
        $.string,
        $.int,
        $.float,
        $.boolean,
        $.list,
        $.map,
        $.path,
        $.null
      ),

    paran: ($) => seq("(", field("expression", $._expression), ")"),

    function_call_expression: ($) =>
      prec(
        "call",
        seq(field("name", $.identifier), field("params", $.function_params))
      ),

    function_params: ($) =>
      seq(
        "(",
        optional(
          seq(
            field("param", $._expression),
            repeat(seq(",", field("param", $._expression)))
          )
        ),
        ")"
      ),

    member_expression: ($) =>
      prec.left(
        "member",
        seq(field("object", $._expression), ".", field("member", $._expression))
      ),

    subscript_expression: ($) =>
      prec.left(
        "subscript",
        seq(
          field("object", $._expression),
          "[",
          field("subscript", $._expression),
          "]"
        )
      ),

    _operator_expression: ($) =>
      choice(
        $.unary_expression,
        $.binary_expression,
        $.ternary_expression,
        $.typecheck_expression
      ),

    unary_expression: ($) =>
      prec.left(
        "unary_void",
        seq(
          field("operator", choice("!", "-", "+", "~")),
          field("expression", $._expression)
        )
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["&&", "and"],
          ["||", "or"],
          ["+", "binary_plus"],
          ["-", "binary_plus"],
          ["*", "binary_times"],
          ["/", "binary_times"],
          ["%", "binary_times"],
          ["<", "binary_relation"],
          ["<=", "binary_relation"],
          ["==", "binary_equality"],
          ["!=", "binary_equality"],
          [">=", "binary_relation"],
          [">", "binary_relation"],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("left", $._expression),
              field("operator", operator),
              field("right", $._expression)
            )
          )
        ),
        ...[
          ["in", "binary_relation"],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq(
              field("right", $._expression),
              field("operator", operator),
              field("left", $._expression)
            )
          )
        )
      ),

    ternary_expression: ($) =>
      prec.right(
        "ternary",
        seq(
          field("condition", $._expression),
          "?",
          field("true", $._expression),
          ":",
          field("false", $._expression)
        )
      ),

    typecheck_expression: ($) =>
      prec.left(
        "binary_relation",
        seq(
          field("expression", $._expression),
          field("operator", "is"),
          field("type", $.identifier)
        )
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z_0-9]*/,

    string: ($) =>
      token(
        choice(
          seq('"', /([^"\\\s]*(\\.|))*/, '"'),
          seq("'", /([^'\\\s]*(\\.|))*/, "'")
        )
      ),

    int: ($) => /[0-9]+/,

    float: ($) => choice(/[0-9]+\.[0-9]*/, /\.[0-9]+/),

    boolean: ($) => choice("true", "false"),

    null: ($) => "null",

    list: ($) =>
      seq(
        "[",
        optional(
          seq(
            field("element", $._expression),
            repeat(seq(",", optional(field("element", $._expression))))
          )
        ),
        "]"
      ),

    entry: ($) => seq(field("key", $.string), ":", field("value", $._expression)),

    map: ($) =>
      seq(
        "{",
        optional(
          seq(
            field("entry", $.entry),
            repeat(seq(",", optional(field("entry", $.entry))))
          )
        ),
        "}"
      ),

    path: ($) =>
      prec.right(repeat1(choice($.path_string, $.path_reference_string, $.path_bind_string))),

    path_reference_string: ($) =>
      seq("/", "$", "(", field("value", $._expression), ")"),

    path_bind_string: ($) =>
      seq("/", "{", field("value", $.identifier), "}"),

    comment: ($) => token(choice(/\/\/.*/, /\/\*([^/*]|\*+[^*\/])*\*+\//)),
  },
});
