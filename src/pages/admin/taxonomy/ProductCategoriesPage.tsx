import type { FC } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import TaxonomyManager from '../../../components/admin/taxonomy/TaxonomyManager';
import { productCategoryService } from '../../../services/productCategoryService';
import type { ProductCategory, TaxonomyFormValues } from '../../../types/taxonomy';

const ProductCategoriesPage: FC = () => {
  const createEntity = (payload: TaxonomyFormValues) => productCategoryService.create(payload);
  const updateEntity = (id: number, payload: TaxonomyFormValues) => productCategoryService.update({ id, ...payload });
  const archiveEntity = (id: number) => productCategoryService.archive(id);

  return (
    <AdminLayout>
      <TaxonomyManager<ProductCategory>
        title="Product Categories"
        entityName="Category"
        description="Define and maintain consistent product categories so teams can organize menus and run category-level analytics."
        fetchEntities={() => productCategoryService.getAll()}
        createEntity={createEntity}
        updateEntity={updateEntity}
        archiveEntity={archiveEntity}
      />
    </AdminLayout>
  );
};

export default ProductCategoriesPage;
