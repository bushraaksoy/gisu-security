export const relationLabels = {
  FATHER: "Father",
  MOTHER: "Mother",
  OTHER: "Other",
}
export function directoryName(person) {
  return [person.givenName, person.middleName, person.surname]
    .filter((part) => part && part.trim() !== "")
    .join(" ")
}
export function matchesDirectoryQuery(text, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) {
    return true
  }
  const haystack = text.toLowerCase()
  return terms.every((term) => haystack.includes(term))
}
export function guardiansForStudent(directory, studentId) {
  return directory.links.flatMap((link) => {
    if (link.studentId !== studentId) {
      return []
    }
    const guardian = directory.guardians.find(
      (person) => person.id === link.guardianId
    )
    if (!guardian) {
      return []
    }
    return [{ relation: link.relation, guardian }]
  })
}
export function studentsForGuardian(directory, guardianId) {
  return directory.links.flatMap((link) => {
    if (link.guardianId !== guardianId) {
      return []
    }
    const student = directory.students.find(
      (person) => person.id === link.studentId
    )
    if (!student) {
      return []
    }
    return [{ relation: link.relation, student }]
  })
}
