class CreateKidsminInvitations < ActiveRecord::Migration[7.2]
  def change
    create_table :kidsmin_invitations do |t|
      t.references :family, null: false,
                             foreign_key: { to_table: :kidsmin_families },
                             index: true
      t.string   :token,       null: false
      t.datetime :expires_at,  null: false
      t.datetime :accepted_at

      t.timestamps
    end

    add_index :kidsmin_invitations, :token, unique: true
  end
end
