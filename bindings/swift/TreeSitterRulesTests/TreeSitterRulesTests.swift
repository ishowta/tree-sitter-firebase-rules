import XCTest
import SwiftTreeSitter
import TreeSitterRules

final class TreeSitterRulesTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_rules())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading firebase rules grammar")
    }
}
