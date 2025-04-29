const editButtons = document.querySelectorAll(".edit, .edit-link");
editButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    location.href = "edit_schedule.html";
  });
});
