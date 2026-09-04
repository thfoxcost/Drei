export type ConversationComment = {
  type: "comment"
  date: string
  username: string
  avatarLink?: string
  comment: string
}

export type ConversationCommit = {
  type: "commit"
  date: string
  username: string
  avatarLink?: string
  message: string
  hash: string
}

export type ConversationReview = {
  type: "review"
  date: string
  username: string
  avatarLink?: string
  filePath: string
  isOutdated?: boolean
}

export type ConversationItem =
  | ConversationComment
  | ConversationCommit
  | ConversationReview