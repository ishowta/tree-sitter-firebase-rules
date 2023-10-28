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
      "bitwise_and",
      "bitwise_xor",
      "bitwise_or",
      "logical_and",
      "logical_or",
      "ternary",
    ],
  ],

  rules: {
    source_file: ($) =>
      seq(optional($.rules_version_statement), repeat($.service_declaration)),

    rules_version_statement: ($) =>
      seq("rules_version", "=", $.string, optional(";")),

    service_declaration: ($) =>
      seq(
        "service",
        /[^\s]+/,
        "{",
        choice($.function_declaration, $.match_declaration),
        "}"
      ),

    function_declaration: ($) =>
      seq(
        "function",
        $.identifier,
        $.function_argument,
        "{",
        $.function_body,
        "}"
      ),

    function_argument: ($) =>
      seq(
        "(",
        optional(seq($.identifier, repeat(seq(",", $.identifier)))),
        ")"
      ),

    function_body: ($) => seq(repeat($.statement), $.return_statement),

    return_statement: ($) => seq("return", $._expression, optional(";")),

    match_declaration: ($) =>
      seq(
        "match",
        $.match_path_parameter,
        "{",
        repeat1(
          choice(
            $.function_declaration,
            $.match_declaration,
            $.allow_declaration
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

    path_string: ($) => /\/[a-zA-Z0-9_%\-~&'.:]+/, // TODO: misterias charset...

    path_capture_string: ($) => seq("/", "{", $.identifier, "}"),

    path_capture_group_string: ($) => seq("/", "{", $.identifier, "=**", "}"),

    allow_operation_literal: ($) =>
      choice("read", "get", "list", "write", "update", "delete", "create"),

    allow_declaration: ($) =>
      seq(
        "allow",
        $.allow_operation_literal,
        repeat(seq(",", $.allow_operation_literal)),
        ":",
        "if",
        $._expression,
        optional(";")
      ),

    statement: ($) => $.let_declaration,

    let_declaration: ($) => seq("let", $.identifier, "=", $._expression, ";"),

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
      choice($.string, $.number, $.boolean, $.list, $.path, $.null),

    paran: ($) => seq("(", $._expression, ")"),

    function_call_expression: ($) =>
      prec("call", seq($._expression, $.function_params)),

    function_params: ($) =>
      seq(
        "(",
        optional(seq($._expression, repeat(seq(",", $._expression)))),
        ")"
      ),

    member_expression: ($) =>
      prec.left("member", seq($._expression, ".", $._expression)),

    subscript_expression: ($) =>
      prec.left("subscript", seq($._expression, "[", $._expression, "]")),

    _operator_expression: ($) =>
      choice($.unary_expression, $.binary_expression, $.ternary_expression),

    unary_expression: ($) =>
      prec.left(
        "unary_void",
        seq(field("operator", choice("!", "-", "+", "~")), $._expression)
      ),

    binary_expression: ($) =>
      choice(
        ...[
          ["&&", "logical_and"],
          ["||", "logical_or"],
          ["&", "bitwise_and"],
          ["^", "bitwise_xor"],
          ["|", "bitwise_or"],
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
          ["is", "binary_relation"],
          ["in", "binary_relation"],
        ].map(([operator, precedence]) =>
          prec.left(
            precedence,
            seq($._expression, field("operator", operator), $._expression)
          )
        )
      ),

    ternary_expression: ($) =>
      prec.right(
        "ternary",
        seq($._expression, "?", $._expression, ":", $._expression)
      ),

    identifier: ($) => /[a-zA-Z_][a-zA-Z_0-9]+/,

    string: ($) =>
      token(
        choice(
          seq('"', /([^"\\\s]*(\\.|))*/, '"'),
          seq("'", /([^'\\\s]*(\\.|))*/, "'")
        )
      ),

    number: ($) => choice(/[0-9]+(|\.[0-9]*)/, /\.[0-9]+/),

    boolean: ($) => choice("true", "false"),

    null: ($) => "null",

    list: ($) =>
      seq(
        "[",
        optional(seq($._expression, repeat(seq(",", optional($._expression))))),
        "]"
      ),

    path: ($) =>
      prec.right(repeat1(choice($.path_string, $.path_reference_string))),

    path_reference_string: ($) => seq("/", "$", "(", $._expression, ")"),

    comment: ($) => token(choice(/\/\/.*/, /\/\*([^/*]|\*+[^*\/])*\*+\//)),
  },
});
