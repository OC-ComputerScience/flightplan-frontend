export const semesters = [
  { value: 8, name: "Freshmen 1" },
  { value: 7, name: "Freshmen 2" },
  { value: 6, name: "Sophomore 1" },
  { value: 5, name: "Sophomore 2" },
  { value: 4, name: "Junior 1" },
  { value: 3, name: "Junior 2" },
  { value: 2, name: "Senior 1" },
  { value: 1, name: "Senior 2" },
];

export const formatSemester = (semesterFromGraduation) => {
  const semesterValue = semesters.find(
    (semester) => semester.value === semesterFromGraduation,
  );
  if (semesterValue) return semesterValue;
  else return semesterFromGraduation + "Semesters From Graduation";
};
