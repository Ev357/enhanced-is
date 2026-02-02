import browser from "webextension-polyfill";
import type { Subject } from "./enhancements/compute";

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
      seminarButton.setAttribute("id", `${seminar.id}-select`);
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
    }

    document.getElementById("subjects")!.appendChild(subjectDiv);
  }

  console.log(subjects);
})();
