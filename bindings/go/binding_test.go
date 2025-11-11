package tree_sitter_rules_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_rules "github.com/ishowta/tree-sitter-firebase-rules/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_rules.Language())
	if language == nil {
		t.Errorf("Error loading firebase rules grammar")
	}
}
