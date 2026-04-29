module Kidsmin
  module Api
    module V1
      module Admin
        class FamiliesController < BaseController
          before_action :require_admin!

          # POST /api/v1/admin/families
          # Quick-creates a family + children + invitation, optionally sends SMS.
          def create
            family = build_family
            family.save!

            build_children(family)

            invitation = Invitation.create!(family: family)
            sms_sent   = maybe_send_sms(family, invitation)

            render json: {
              family:     FamilyBlueprint.render_as_hash(family, view: :with_children),
              invite_url: invitation.invite_url,
              sms_sent:   sms_sent
            }, status: :created

          rescue ActiveRecord::RecordInvalid => e
            render json: { error: e.message, code: "validation_error" },
                   status: :unprocessable_entity
          end

          private

          def build_family
            p = family_params
            Family.new(
              supabase_uid:               "pending_#{SecureRandom.hex(8)}",
              family_name:                "#{p[:primary_contact_last_name]} Family".strip.presence || "New Family",
              primary_contact_first_name: p[:primary_contact_first_name],
              primary_contact_last_name:  p[:primary_contact_last_name],
              phone:                      p[:phone],
              email:                      p[:email],
              address:                    p[:address]
            )
          end

          def build_children(family)
            return unless params[:children].present?

            params[:children].each do |child_params|
              next if child_params[:first_name].blank?

              family.children.create!(
                first_name: child_params[:first_name],
                last_name:  child_params[:last_name].presence || family.primary_contact_last_name,
                birthdate:  age_to_birthdate(child_params[:age]),
                notes:      child_params[:notes].presence
              )
            end
          end

          # Convert age integer to an approximate birthdate (July 1 of birth year).
          # Parents correct the exact date when completing their profile.
          def age_to_birthdate(age)
            return nil if age.blank?
            years = age.to_i
            return nil if years <= 0
            Date.new(Date.current.year - years, 7, 1)
          end

          def maybe_send_sms(family, invitation)
            return false if family.phone.blank?
            return false unless SmsClient.configured?

            first = family.primary_contact_first_name.presence || "there"
            body  = "Hi #{first}! Complete your Kids Min family profile here: #{invitation.invite_url} (link expires in 7 days)"
            SmsClient.send(to: family.phone, body: body)
          end

          def family_params
            params.require(:family).permit(
              :primary_contact_first_name,
              :primary_contact_last_name,
              :phone,
              :email,
              :address
            )
          end
        end
      end
    end
  end
end
