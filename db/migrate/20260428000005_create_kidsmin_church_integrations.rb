class CreateKidsminChurchIntegrations < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_church_integrations do |t|
      t.string   :token_type,    null: false  # "personal" | "oauth"
      t.text     :access_token               # AES-256-GCM encrypted
      t.text     :refresh_token              # AES-256-GCM encrypted
      t.string   :scope
      t.datetime :expires_at

      t.timestamps
    end
  end
end
