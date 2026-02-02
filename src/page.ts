import browser from "webextension-polyfill";
import type { Schedule, Seminar, Subject } from "./enhancements/compute";

const addedSubjects = new Map<Subject, Seminar>();

const handleSelect = (event: PointerEvent, seminar: Seminar, subject: Subject) => {
  const currentTarget = event.currentTarget;
  if (!(currentTarget instanceof HTMLButtonElement))
    throw new Error("currentTarget is not a HTMLButtonElement");

  const addedSeminar = addedSubjects.get(subject);

  if (!addedSeminar) {
    addSubject(subject, seminar);
    currentTarget.dataset.selected = "true";
    return;
  }

  removeSubject(subject);

  if (seminar === addedSeminar) {
    currentTarget.dataset.selected = "false";
    return;
  }

  const previousSelectedSeminar = document.getElementById(addedSeminar.id)!;
  previousSelectedSeminar.dataset.selected = "false";
  addSubject(subject, seminar);
  currentTarget.dataset.selected = "true";
};

const addSubject = (subject: Subject, seminar: Seminar) => {
  for (const [index, schedule] of seminar.schedules.entries()) {
    const seminarContainerDiv = document.createElement("div");
    seminarContainerDiv.classList = "absolute p-0.5";
    seminarContainerDiv.id = `${subject.id}-${index}`;

    const { offset, duration } = calculateSchedulePosition(schedule);

    seminarContainerDiv.style.top = `${offset}px`;
    seminarContainerDiv.style.height = `${duration}px`;

    const seminarDiv = document.createElement("div");
    seminarDiv.classList = "h-full rounded border bg-gray-900 p-0.5";

    const seminarTitleP = document.createElement("p");
    seminarTitleP.textContent = subject.title;
    seminarDiv.appendChild(seminarTitleP);

    const seminarScheduleP = document.createElement("p");
    seminarScheduleP.textContent = `${schedule.day} ${schedule.startTime} - ${schedule.endTime}`;
    seminarDiv.appendChild(seminarScheduleP);

    seminarContainerDiv.appendChild(seminarDiv);

    document.getElementById(schedule.day)!.appendChild(seminarContainerDiv);
  }

  addedSubjects.set(subject, seminar);
};

const removeSubject = (subject: Subject) => {
  const calendarDivs = Array.from(document.querySelectorAll(`div[id^="${subject.id}-"]`));
  if (!calendarDivs.length) throw new Error("Calendar divs not found");

  for (const calendarDiv of calendarDivs) {
    calendarDiv.remove();
  }

  addedSubjects.delete(subject);
};

const calculateSchedulePosition = (schedule: Schedule) => {
  const [startHourString, startMinuteString] = schedule.startTime.split(":");
  const [endHourString, endMinuteString] = schedule.endTime.split(":");

  if (!startHourString || !startMinuteString || !endHourString || !endMinuteString)
    throw new Error("Invalid schedule");

  const startHour = Number(startHourString);
  const startMinute = Number(startMinuteString);
  const endHour = Number(endHourString);
  const endMinute = Number(endMinuteString);

  const offset = startHour * 60 + startMinute;
  const duration = endHour * 60 + endMinute - offset;

  return {
    offset,
    duration,
  };
};

(async () => {
  const data = await browser.storage.local.get("subjects");
  /* @ts-expect-error */
  const subjects: Subject[] = data.subjects;
  for (const subject of subjects) {
    const subjectDiv = document.createElement("div");
    subjectDiv.classList = "flex w-80 flex-col rounded border";

    const subjectTitle = document.createElement("p");
    subjectTitle.classList = "h-20 p-2 text-center";
    subjectTitle.textContent = subject.title;
    subjectDiv.appendChild(subjectTitle);

    const subjectDivider = document.createElement("div");
    subjectDivider.classList = "h-px w-full bg-white";
    subjectDiv.appendChild(subjectDivider);

    const seminarContainer = document.createElement("div");
    seminarContainer.classList = "flex flex-col gap-2 p-2";
    subjectDiv.appendChild(seminarContainer);

    for (const seminar of subject.seminars) {
      const seminarButton = document.createElement("button");
      seminarButton.classList =
        "flex flex-col rounded border p-2 text-start data-[selected=true]:bg-gray-500";
      seminarButton.id = seminar.id;
      seminarButton.dataset.selected = "false";

      const seminarIdP = document.createElement("p");
      seminarIdP.textContent = `id: ${seminar.id}`;
      seminarButton.appendChild(seminarIdP);

      const seminarScheduleP = document.createElement("p");
      const scheduleString = seminar.schedules.reduce(
        (scheduleString, schedule, index) =>
          `${scheduleString}${schedule.day} ${schedule.startTime} - ${schedule.endTime}${index === seminar.schedules.length - 1 ? "" : ", "}`,
        "",
      );
      seminarScheduleP.textContent = `schedule: ${scheduleString}`;
      seminarButton.appendChild(seminarScheduleP);

      const seminarTeacherP = document.createElement("p");
      seminarTeacherP.textContent = "teacher: ";

      const seminarTeacherA = document.createElement("a");
      seminarTeacherA.href = seminar.teacher.link;
      seminarTeacherA.target = "_blank";
      seminarTeacherA.classList = "hover:underline";
      seminarTeacherA.textContent = seminar.teacher.name;
      seminarTeacherP.appendChild(seminarTeacherA);

      if (seminar.teacher.ratingLink) {
        const seminarRatingA = document.createElement("a");
        seminarRatingA.href = seminar.teacher.ratingLink;
        seminarRatingA.target = "_blank";
        seminarRatingA.classList = "hover:underline";
        seminarRatingA.textContent = "(rating)";
        seminarTeacherP.appendChild(seminarRatingA);
      }
      seminarButton.appendChild(seminarTeacherP);

      const seminarRegisterLinkP = document.createElement("p");
      const seminarRegisterLinkA = document.createElement("a");
      seminarRegisterLinkA.href = seminar.registerLink;
      seminarRegisterLinkA.target = "_blank";
      seminarRegisterLinkA.classList = "text-blue-200 hover:underline";
      seminarRegisterLinkA.textContent = "registerLink";
      seminarRegisterLinkP.appendChild(seminarRegisterLinkA);
      seminarButton.appendChild(seminarRegisterLinkP);

      seminarContainer.appendChild(seminarButton);

      seminarButton.addEventListener("click", (event) => handleSelect(event, seminar, subject));
    }

    document.getElementById("subjects")!.appendChild(subjectDiv);
  }
})();
