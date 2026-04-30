module Kidsmin
  class InviteMailer < ApplicationMailer
    def invite(family, invitation)
      @family     = family
      @invite_url = invitation.invite_url
      @first_name = family.primary_contact_first_name.presence || "there"

      mail(
        to:      family.email,
        subject: "You're invited to join Kids Min at our church!"
      )
    end
  end
end
