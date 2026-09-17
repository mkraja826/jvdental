"use client";

import { FormEvent } from "react";
import { deleteDoctorProfile } from "@/app/clinic/doctors/actions";

export default function DeleteDoctorProfileButton({ doctorId, doctorName }: { doctorId: string; doctorName: string }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      "Delete " + doctorName + "? This removes the profile and its qualifications, memberships and external links. Linked cases and articles will be kept but unlinked. This cannot be undone.",
    );
    if (!confirmed) event.preventDefault();
  }

  return (
    <form action={deleteDoctorProfile} onSubmit={confirmDelete} className="doctor-delete-form">
      <input type="hidden" name="id" value={doctorId} />
      <input type="hidden" name="confirmation" value="DELETE" />
      <button className="button doctor-delete-button" type="submit">Delete doctor profile</button>
    </form>
  );
}
