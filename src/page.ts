import browser from "webextension-polyfill";
import type { Seminar, Subject } from "./enhancements/compute";

const addedSeminars = new Set<Seminar>();

const handleSelect = (event: PointerEvent, seminar: Seminar, subject: Subject) => {
  const currentTarget = event.currentTarget;
  if (!(currentTarget instanceof HTMLButtonElement))
    throw new Error("currentTarget is not a HTMLButtonElement");

  if (!addedSeminars.has(seminar)) {
    addSeminar(seminar, subject);
    currentTarget.dataset.selected = "true";
    return;
  }

  removeSeminar(seminar);
  currentTarget.dataset.selected = "false";
};

const ID_MAP: Record<string, string> = {
  Po: "mon",
  Út: "tue",
  St: "wed",
  Čt: "thu",
  Pá: "fri",
};

const addSeminar = (seminar: Seminar, subject: Subject) => {
  const seminarContainerDiv = document.createElement("div");
  seminarContainerDiv.classList = "absolute p-0.5";
  seminarContainerDiv.id = `${seminar.id}-calendar`;

  const { offset, duration } = calculatePosition(seminar);

  seminarContainerDiv.style.top = `${offset}px`;
  seminarContainerDiv.style.height = `${duration}px`;

  const seminarDiv = document.createElement("div");
  seminarDiv.classList = "h-full rounded border bg-gray-900 p-0.5";
  seminarDiv.textContent = subject.title;
  seminarContainerDiv.appendChild(seminarDiv);

  const day = ID_MAP[seminar.schedule.day];
  if (!day) throw new Error(`Unknown day: ${seminar.schedule.day}`);
  document.getElementById(day)!.appendChild(seminarContainerDiv);

  addedSeminars.add(seminar);
};

const removeSeminar = (seminar: Seminar) => {
  const calendarDiv = document.getElementById(`${seminar.id}-calendar`);
  if (!calendarDiv) throw new Error("Calendar div not found");

  calendarDiv.remove();
  addedSeminars.delete(seminar);
};

const calculatePosition = (seminar: Seminar) => {
  const [startHourString, startMinuteString] = seminar.schedule.startTime.split(":");
  const [endHourString, endMinuteString] = seminar.schedule.endTime.split(":");

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
      seminarScheduleP.textContent = `schedule: ${seminar.schedule.day} ${seminar.schedule.startTime} - ${seminar.schedule.endTime}`;
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

  console.log(subjects);
})();
