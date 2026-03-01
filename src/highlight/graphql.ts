/**
 * 扩展 GraphQL 语法高亮，增强对 @ 指令的高亮支持
 * 基于 highlight.js graphql 语言，将 directive 使用独立 scope 便于自定义样式
 */
// GraphQL 名称规范: _A-Za-z 开头，后可跟 _0-9A-Za-z
const GQL_NAME = /[_A-Za-z][_0-9A-Za-z]*/

/** @type LanguageFn */
function graphql(hljs: import('highlight.js').HLJSApi) {
  const regex = hljs.regex
  return {
    name: 'GraphQL',
    aliases: ['gql'],
    case_insensitive: true,
    disableAutodetect: false,
    keywords: {
      keyword: [
        'query',
        'mutation',
        'subscription',
        'type',
        'input',
        'schema',
        'directive',
        'interface',
        'union',
        'scalar',
        'fragment',
        'enum',
        'on',
      ],
      literal: ['true', 'false', 'null'],
    },
    contains: [
      hljs.HASH_COMMENT_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.NUMBER_MODE,
      {
        scope: 'punctuation',
        match: /[.]{3}/,
        relevance: 0,
      },
      {
        scope: 'punctuation',
        begin: /[\!\(\)\:\=\[\]\{\|\}]{1}/,
        relevance: 0,
      },
      {
        scope: 'variable',
        begin: /\$/,
        end: /\W/,
        excludeEnd: true,
        relevance: 0,
      },
      // GraphQL 指令：@skip, @include, @deprecated, @defer, @stream 等
      {
        scope: 'directive',
        match: /@[a-zA-Z_][a-zA-Z0-9_]*/,
      },
      {
        scope: 'symbol',
        begin: regex.concat(GQL_NAME, regex.lookahead(/\s*:/)),
        relevance: 0,
      },
    ],
    illegal: [/[;<']/, /BEGIN/],
  }
}

export { graphql as default }
