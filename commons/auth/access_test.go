package auth

import (
	"context"
	"reflect"
	"testing"
	"zen/features/tokens"
)

func TestCanReadAllTags(t *testing.T) {
	tests := []struct {
		name   string
		access Access
		want   bool
	}{
		{name: "unrestricted", access: Unrestricted, want: true},
		{name: "nil read list", access: Access{ReadTagIDs: nil}, want: true},
		{name: "empty read list", access: Access{ReadTagIDs: []int{}}, want: false},
		{name: "some tags", access: Access{ReadTagIDs: []int{1, 2}}, want: false},
	}

	for _, test := range tests {
		got := CanReadAllTags(test.access)
		if got != test.want {
			t.Errorf("%s: CanReadAllTags(%+v) = %v, want %v", test.name, test.access, got, test.want)
		}
	}
}

func TestCanWrite(t *testing.T) {
	tests := []struct {
		name   string
		access Access
		tagIDs []int
		want   bool
	}{
		{name: "all tags, no tags", access: Access{WriteTagIDs: nil}, tagIDs: nil, want: true},
		{name: "all tags, new tag", access: Access{WriteTagIDs: nil}, tagIDs: []int{-1}, want: true},
		{name: "no grants", access: Access{WriteTagIDs: []int{}}, tagIDs: []int{1}, want: false},
		{name: "scoped, untagged note", access: Access{WriteTagIDs: []int{1}}, tagIDs: []int{}, want: false},
		{name: "scoped, granted tag", access: Access{WriteTagIDs: []int{1}}, tagIDs: []int{1}, want: true},
		{name: "scoped, every tag granted", access: Access{WriteTagIDs: []int{1, 2, 3}}, tagIDs: []int{3, 1}, want: true},
		{name: "scoped, one tag not granted", access: Access{WriteTagIDs: []int{1}}, tagIDs: []int{1, 2}, want: false},
		{name: "scoped, new tag", access: Access{WriteTagIDs: []int{1}}, tagIDs: []int{1, -1}, want: false},
		{name: "fail-closed access", access: GetAccess(context.Background()), tagIDs: []int{1}, want: false},
	}

	for _, test := range tests {
		got := CanWrite(test.access, test.tagIDs)
		if got != test.want {
			t.Errorf("%s: CanWrite(%+v, %v) = %v, want %v", test.name, test.access, test.tagIDs, got, test.want)
		}
	}
}

func TestGetAccessFromScopes(t *testing.T) {
	tests := []struct {
		name   string
		scopes []tokens.Scope
		want   Access
	}{
		{
			name:   "no scopes",
			scopes: nil,
			want:   Access{ReadTagIDs: []int{}, WriteTagIDs: []int{}},
		},
		{
			name:   "read all tags",
			scopes: []tokens.Scope{{TagID: tokens.AllTags, CanRead: true}},
			want:   Access{ReadTagIDs: nil, WriteTagIDs: []int{}},
		},
		{
			name:   "write all tags",
			scopes: []tokens.Scope{{TagID: tokens.AllTags, CanRead: true, CanWrite: true}},
			want:   Access{ReadTagIDs: nil, WriteTagIDs: nil},
		},
		{
			name:   "scoped read and write",
			scopes: []tokens.Scope{{TagID: 1, CanRead: true}, {TagID: 2, CanRead: true, CanWrite: true}},
			want:   Access{ReadTagIDs: []int{1, 2}, WriteTagIDs: []int{2}},
		},
		{
			name:   "all-tags read with a scoped write",
			scopes: []tokens.Scope{{TagID: tokens.AllTags, CanRead: true}, {TagID: 3, CanRead: true, CanWrite: true}},
			want:   Access{ReadTagIDs: nil, WriteTagIDs: []int{3}},
		},
	}

	for _, test := range tests {
		got := getAccessFromScopes(test.scopes)
		if !reflect.DeepEqual(got, test.want) {
			t.Errorf("%s: getAccessFromScopes(%+v) = %+v, want %+v", test.name, test.scopes, got, test.want)
		}
	}
}
