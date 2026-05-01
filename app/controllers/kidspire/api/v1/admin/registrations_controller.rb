module Kidspire
  module Api
    module V1
      module Admin
        class RegistrationsController < BaseController
          before_action :require_admin!

          # GET /api/v1/admin/registrations
          def index
            regs = Registration.includes(:family, :child, :event)
                               .joins(:event)
                               .order("kidspire_events.event_date DESC, kidspire_registrations.created_at DESC")
                               .page(params[:page]).per(100)

            render json: {
              registrations: regs.map { |r|
                {
                  id:           r.id,
                  family_name:  r.family.family_name || "#{r.family.primary_contact_last_name} Family",
                  child_name:   "#{r.child.first_name} #{r.child.last_name}",
                  child_grade:  r.child.grade_display,
                  event_title:  r.event.title,
                  event_date:   r.event.event_date,
                  registered_at: r.created_at,
                }
              },
              meta: {
                total_count:  regs.total_count,
                current_page: regs.current_page,
                total_pages:  regs.total_pages,
              },
            }
          end
        end
      end
    end
  end
end
