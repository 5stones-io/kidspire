class AddAddressToKidsminFamilies < ActiveRecord::Migration[7.2]
  def change
    add_column :kidsmin_families, :address, :string
  end
end
