package tags

import (
	"reflect"
	"strings"
	"testing"
	"zen/commons/auth"
)

func TestBuildReadableTagsPredicate(t *testing.T) {
	tests := []struct {
		name          string
		access        auth.Access
		wantPredicate string
		wantArgs      []interface{}
	}{
		{name: "unrestricted", access: auth.Unrestricted, wantPredicate: "", wantArgs: nil},
		{name: "no readable tags", access: auth.Access{ReadTagIDs: []int{}}, wantPredicate: "AND 0", wantArgs: nil},
		{name: "one tag", access: auth.Access{ReadTagIDs: []int{4}}, wantPredicate: "AND t.tag_id IN (?)", wantArgs: []interface{}{4}},
		{name: "three tags", access: auth.Access{ReadTagIDs: []int{1, 2, 3}}, wantPredicate: "AND t.tag_id IN (?,?,?)", wantArgs: []interface{}{1, 2, 3}},
	}

	for _, test := range tests {
		predicate, args := BuildReadableTagsPredicate(test.access, "t.tag_id")

		if predicate != test.wantPredicate {
			t.Errorf("%s: predicate = %q, want %q", test.name, predicate, test.wantPredicate)
		}

		if !reflect.DeepEqual(args, test.wantArgs) {
			t.Errorf("%s: args = %v, want %v", test.name, args, test.wantArgs)
		}

		placeholderCount := strings.Count(predicate, "?")
		if placeholderCount != len(args) {
			t.Errorf("%s: %d placeholders but %d args", test.name, placeholderCount, len(args))
		}
	}
}
