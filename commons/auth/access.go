package auth

import (
	"context"
	"errors"
	"zen/features/tokens"
)

// Tag lists are nil when every tag is covered and empty when none are.
type Access struct {
	ReadTagIDs  []int
	WriteTagIDs []int
	CanRetag    bool
}

var Unrestricted = Access{CanRetag: true}

var ErrForbidden = errors.New("no write access to these tags")

type accessContextKey struct{}

func SetAccess(ctx context.Context, access Access) context.Context {
	return context.WithValue(ctx, accessContextKey{}, access)
}

// Fails closed, so a handler reached without the middleware sees nothing.
func GetAccess(ctx context.Context) Access {
	access, ok := ctx.Value(accessContextKey{}).(Access)
	if !ok {
		return Access{ReadTagIDs: []int{}, WriteTagIDs: []int{}}
	}
	return access
}

func CanReadAllTags(access Access) bool {
	return access.ReadTagIDs == nil
}

// Writing needs a grant on every tag, so a read-only tag protects every note carrying it.
// Something with no tags, or a new tag (id -1), is covered only by an all-tags grant.
func CanWrite(access Access, tagIDs []int) bool {
	if access.WriteTagIDs == nil {
		return true
	}

	if len(tagIDs) == 0 {
		return false
	}

	for _, tagID := range tagIDs {
		isGranted := false
		for _, writeTagID := range access.WriteTagIDs {
			if writeTagID == tagID {
				isGranted = true
				break
			}
		}

		if !isGranted {
			return false
		}
	}

	return true
}

func getAccessFromScopes(scopes []tokens.Scope) Access {
	readTagIDs := []int{}
	writeTagIDs := []int{}
	readsAllTags := false
	writesAllTags := false

	for _, scope := range scopes {
		if scope.CanRead {
			if scope.TagID == tokens.AllTags {
				readsAllTags = true
			} else {
				readTagIDs = append(readTagIDs, scope.TagID)
			}
		}

		if scope.CanWrite {
			if scope.TagID == tokens.AllTags {
				writesAllTags = true
			} else {
				writeTagIDs = append(writeTagIDs, scope.TagID)
			}
		}
	}

	if readsAllTags {
		readTagIDs = nil
	}

	if writesAllTags {
		writeTagIDs = nil
	}

	return Access{ReadTagIDs: readTagIDs, WriteTagIDs: writeTagIDs}
}
