from import_export import resources, fields
from import_export.formats.base_formats import XLS
import tablib
from import_export.widgets import ForeignKeyWidget, ManyToManyWidget
from import_export.results import RowResult, Result
from .models import *
from tablib import Dataset
#############Import export Model Resources################


class TopicResource(resources.ModelResource):
    class Meta:
        model = Topic
        import_id_fields = ('title_ENG', 'title_AMH')

class CategoryResource(resources.ModelResource):
    topic = fields.Field(
        column_name='topic',
        attribute='topic',
        widget=ForeignKeyWidget(Topic, field='title_ENG'),
        saves_null_values = True,
        )

    def before_import_row(self, row, **kwargs):
            if row.get('topic') is None:
               pass
            else :
               topic_name = row["topic"]
               Topic.objects.get_or_create(title_ENG=topic_name, defaults={"title_ENG": topic_name, "title_AMH":topic_name})
    
    class Meta:
        model = Category
        report_skipped = True
        skip_unchanged = True
        exclude = ( 'id', 'created_at', 'is_deleted','is_dashboard_visible',)
        import_id_fields = ('name_ENG', 'name_AMH')

class TagResource(resources.ModelResource):
    class Meta:
        model = Tag

class IndicatorResource(resources.ModelResource):
    for_category = fields.Field(
        column_name='for_category',
        attribute='for_category',
        widget=ManyToManyWidget(Category, field='name_ENG', separator=','),
        saves_null_values=True,
    )
    
    parent = fields.Field(
        column_name='parent',
        attribute='parent',
        widget=ForeignKeyWidget(Indicator, field='id'),
        saves_null_values=True,
    )
    class Meta:
        model = Indicator
        import_id_fields = ('id',)             
        skip_unchanged = False                 
        report_skipped = True          
    
    def after_import(self, dataset, result, using_transactions, dry_run, **kwargs):
        if dry_run:
            return  

        imported_instances = [row_result.instance for row_result in result.rows if row_result.instance]

        for instance in imported_instances:
            try:
                instance.generate_code()
                instance.save(update_fields=['code'])
            except Exception as e:
                print(f"Error generating code for {instance.id}: {e}")


class DataPointResource(resources.ModelResource):

    class Meta:
        model = DataPoint
        skip_unchanged = True
        report_skipped = True
        exclude = ( 'id','created_at', 'updated_at')
        import_id_fields = ('year_EC', 'year_GC')

class AnnualDataResource(resources.ModelResource):    
    indicator = fields.Field(
        column_name='indicator',
        attribute='indicator',
        widget=ForeignKeyWidget(Indicator, field='code'),
        saves_null_values = True,
    ) 
    

    for_datapoint = fields.Field(
        column_name='for_datapoint',
        attribute='for_datapoint',
        widget=ForeignKeyWidget(DataPoint, field='year_EC'),
        saves_null_values = True,
    )


    class Meta:
        model = AnnualData
        skip_unchanged = True
        report_skipped = True
        use_bulk = True
        exclude = ( 'id', 'created_at')
        import_id_fields = ('indicator', 'for_datapoint')

class AnnualDataWideResource(resources.ModelResource):
    indicator = fields.Field(
        column_name='indicator',
        attribute='indicator',
        widget=ForeignKeyWidget(Indicator, 'code')  
    )
    for_datapoint = fields.Field(
        column_name='for_datapoint',
        attribute='for_datapoint',
        widget=ForeignKeyWidget(DataPoint, 'year_EC') 
    )
    performance = fields.Field(
        column_name='performance',
        attribute='performance'
    )

    class Meta:
        model = AnnualData
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ('indicator', 'for_datapoint',)
        fields = ('indicator', 'for_datapoint', 'performance')

    def get_instance(self, instance_loader, row):
        indicator_code = row.get('indicator')
        year_ec = row.get('for_datapoint')
        if not indicator_code or not year_ec:
            return None

        try:
            indicator = Indicator.objects.get(code=indicator_code)
            datapoint = DataPoint.objects.get(year_EC=year_ec)
            return AnnualData.objects.get(indicator=indicator, for_datapoint=datapoint)
        except (Indicator.DoesNotExist, DataPoint.DoesNotExist, AnnualData.DoesNotExist):
            return None
        
    def before_import_row(self, row, **kwargs):
        if row.get('for_datapoint') is None:
               pass
        year = row.get("for_datapoint")
        if year:
            datapoint, created = DataPoint.objects.get_or_create(year_EC=year)
            row["for_datapoint"] = datapoint.year_EC

    def import_data(self, dataset, dry_run=False, raise_errors=False, use_transactions=None, **kwargs):
        result_dataset = Dataset(headers=['indicator', 'for_datapoint', 'performance'])

        new_count = 0
        updated_count = 0

        for row_number, row in enumerate(dataset.dict, start=1):
            indicator_key = row.get('indicator')
            if not indicator_key:
                continue

            try:
                indicator = Indicator.objects.get(code=indicator_key)
            except Indicator.DoesNotExist:
                continue

            for year, value in row.items():
                if year == 'indicator' or value in [None, '']:
                    continue

                try:
                    datapoint, created = DataPoint.objects.get_or_create(year_EC=year)
                except DataPoint.DoesNotExist:
                    continue

                try:
                    performance = float(value)
                except ValueError:
                    continue

                result_dataset.append([indicator_key, year, performance])

                if not dry_run:
                    obj, created = AnnualData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        defaults={'performance': performance}
                    )
                    if created:
                        new_count += 1
                    else:
                        updated_count += 1

        if dry_run:
            return super().import_data(result_dataset, dry_run=True, raise_errors=raise_errors, **kwargs)

        result = Result()
        result.rows = []
        result.totals = {
            'new': new_count,
            'update': updated_count,
            'skip': 0,
            'failed': 0,
            'delete': 0,
        }
        result.diff_headers = ['indicator', 'for_datapoint', 'performance']

        return result

class QuarterDataResource(resources.ModelResource):    
    indicator = fields.Field(
        column_name='indicator',
        attribute='indicator',
        widget=ForeignKeyWidget(Indicator, 'code'),
        saves_null_values = True,
    ) 

    for_quarter = fields.Field(
        column_name='for_quarter',
        attribute='for_quarter',
        widget=ForeignKeyWidget(Quarter, field='number'),
        saves_null_values = True,
    )
    
    for_datapoint = fields.Field(
        column_name='for_datapoint',
        attribute='for_datapoint',
        widget=ForeignKeyWidget(DataPoint, 'year_EC') 
    )

    performance = fields.Field(
        column_name='performance',
        attribute='performance'
    )


    class Meta:
        model = QuarterData
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ('indicator', 'for_datapoint', 'for_quarter')
        fields = ('indicator', 'for_datapoint', 'for_quarter', 'performance')

    

    def get_instance(self, instance_loader, row):
        indicator_code = row.get('indicator')
        quarter_num = row.get('for_quarter')
        year_ec = row.get('for_datapoint')


        try:
            indicator = Indicator.objects.get(code = indicator_code)
            dataPoint = DataPoint.objects.get(year_EC=year_ec)
            quarter = Quarter.objects.get(number=quarter_num)
            return QuarterData.objects.get(indicator=indicator, for_datapoint=dataPoint, for_quarter=quarter)
        except (Indicator.DoesNotExist, DataPoint.DoesNotExist, AnnualData.DoesNotExist, QuarterData.DoesNotExist):
            return None
    
    def before_import_row(self, row, **kwargs):
        if row.get('for_datapoint') is None or row.get('for_quarter') is None:
            pass

        try:
            year = int(row.get("for_datapoint"))
            quarter = int(row.get("for_quarter"))
        except (TypeError, ValueError):
            return
        
        

        if 1 <= quarter <= 4:
            datapoint, created = DataPoint.objects.get_or_create(year_EC=year)
            row["for_datapoint"] = datapoint.year_EC
            row["quarter"] = quarter

    def import_data(self, dataset, dry_run = False, raise_errors = False, use_transactions = None, collect_failed_rows = False, rollback_on_validation_errors = False, **kwargs):
        result_dataset = Dataset(headers=['indicator', 'for_datapoint', 'for_quarter',  'performance'])
        
        new_count = 0
        updated_count = 0

        for row_number, row in enumerate(dataset.dict, start=1):
            year_raw = row.get('for_datapoint')
            quarter_raw = row.get('for_quarter')
            
        

            try:
                quarter = int(quarter_raw)
            except (ValueError, TypeError):
                continue

            if not (1 <= quarter <= 4):
                continue

            quarter_instance = Quarter.objects.get(number = quarter)

            try:
                year_int = int(year_raw)
                datapoint, _ = DataPoint.objects.get_or_create(year_EC=year_int)
            except (ValueError, TypeError):
                continue
            except DataPoint.MultipleObjectsReturned:
                continue

            
    
            for indicator_code, value in row.items():
                if indicator_code in ['for_datapoint', 'for_quarter'] or value in [None, '']:
                    continue

                try:
                    indicator = Indicator.objects.get(code=indicator_code)
                except Indicator.DoesNotExist:
                    continue

            
                try:
                    performance = float(value)
                except (ValueError, TypeError):
                    continue

                result_dataset.append([indicator_code, year_raw, quarter, performance])

                if not dry_run:
                    obj, created = QuarterData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_quarter=quarter_instance,
                        defaults={'performance': performance}
                    )

                    if created:
                        new_count += 1
                    else:
                        updated_count += 1

        if dry_run:
            return super().import_data(result_dataset, dry_run=True, raise_errors=raise_errors, **kwargs)

        result = Result()
        result.rows = []
        result.totals = {
            'new': new_count,
            'update': updated_count,
            'skip': 0,
            'failed': 0,
            'delete': 0,
        }
        result.diff_headers = ['indicator',  'for_datapoint', 'for_quarter', 'performance']

        return result


class MonthDataResource(resources.ModelResource):    
    indicator = fields.Field(
        column_name='indicator',
        attribute='indicator',
        widget=ForeignKeyWidget(Indicator, 'code'),
    )

    for_month = fields.Field(
        column_name='for_month',
        attribute='for_month',
        widget=ForeignKeyWidget(Month, field='number'),
        saves_null_values = True,
    )
    

    for_datapoint = fields.Field(
        column_name='for_datapoint',
        attribute='for_datapoint',
        widget=ForeignKeyWidget(DataPoint, 'year_EC') 
    )

    performance = fields.Field(
        column_name='performance',
        attribute='performance'
    )


    class Meta:
        model = MonthData
        skip_unchanged = True
        report_skipped = True
        import_id_fields = ('indicator', 'for_datapoint', 'for_month')
        fields = ('indicator', 'for_datapoint', 'for_month', 'performance')
    

    def get_instance(self, instance_loader, row):
        indicator_code = row.get('indicator')
        month_num = row.get('for_month')
        year_ec = row.get('for_datapoint')


        try:
            indicator = Indicator.objects.get(code = indicator_code)
            dataPoint = DataPoint.objects.get(year_EC=year_ec)
            month = Month.objects.get(number=month_num)
            return MonthData.objects.get(indicator=indicator, for_datapoint=dataPoint, for_month=month)
        except (Indicator.DoesNotExist, DataPoint.DoesNotExist, AnnualData.DoesNotExist, MonthData.DoesNotExist):
            return None
    
    def before_import_row(self, row, **kwargs):
        if row.get('for_datapoint') is None or row.get('for_month') is None:
            pass

        try:
            year = int(row.get("for_datapoint"))
            month = int(row.get("for_month"))
        except (TypeError, ValueError):
            return
        
        if 1 <= month <= 12:
            datapoint, created = DataPoint.objects.get_or_create(year_EC=year)
            row["for_datapoint"] = datapoint.year_EC
            row["month"] = month
    
    def import_data(self, dataset, dry_run = False, raise_errors = False, use_transactions = None, collect_failed_rows = False, rollback_on_validation_errors = False, **kwargs):
        result_dataset = Dataset(headers=['indicator', 'for_datapoint', 'for_month',  'performance'])
        
        new_count = 0
        updated_count = 0

        for row_number, row in enumerate(dataset.dict, start=1):
            year_raw = row.get('for_datapoint')
            month_raw = row.get('for_month')

            try:
                month = int(month_raw)
            except (ValueError, TypeError):
                continue

            if not (1 <= month <= 12):
                continue

            month_instance = Month.objects.get(number = month)

            try:
                year_int = int(year_raw)
                datapoint, _ = DataPoint.objects.get_or_create(year_EC=year_int)
            except (ValueError, TypeError):
                continue
            except DataPoint.MultipleObjectsReturned:
                continue

                
            for indicator_code, value in row.items():
                if indicator_code in ['for_datapoint', 'for_month'] or value in [None, '']:
                    continue

                
                try:
                    indicator = Indicator.objects.get(code=indicator_code)
                except Indicator.DoesNotExist:
                    continue

                try:
                    performance = round(float(value), 2)
                except (ValueError, TypeError):
                    continue

                result_dataset.append([indicator_code, year_raw, month, performance])

                if not dry_run:
                    obj, created = MonthData.objects.update_or_create(
                        indicator=indicator,
                        for_datapoint=datapoint,
                        for_month=month_instance,
                        defaults={'performance': performance}
                    )

                    if created:
                        new_count += 1
                    else:
                        updated_count += 1

        
        print(result_dataset)
        if dry_run:
            return super().import_data(result_dataset, dry_run=True, raise_errors=raise_errors, **kwargs)

        result = Result()
        result.rows = []
        result.totals = {
            'new': new_count,
            'update': updated_count,
            'skip': 0,
            'failed': 0,
            'delete': 0,
        }
        result.diff_headers = ['indicator',  'for_datapoint', 'for_month', 'performance']

        return result


#############Handle uploaded excel files################

def handle_uploaded_Topic_file(file):
    try:
        resource = TopicResource()
        dataset = tablib.Dataset()

        imported_data = dataset.load(file.read())
        result = resource.import_data(imported_data, dry_run=True, collect_failed_rows=True)
        
        if not result.has_errors():
            return True, imported_data, result
        else:
            return False, imported_data, result
    except Exception as e:
        # Ensure variables are initialized in case of an exception
        imported_data = None
        result = None
        return False, imported_data, result 

def handle_uploaded_Indicator_file(file):
    try:
        resource  = IndicatorResource()
        dataset = tablib.Dataset()

        imported_data = dataset.load(file.read())
        result = resource.import_data(imported_data, dry_run=True, collect_failed_rows = True)
        
        if not result.has_errors():
            return True, imported_data, result
        else:
            return False, imported_data, result
    except Exception as e:
         return False, imported_data, result

def handle_uploaded_Category_file(file):
    try:
        resource  = CategoryResource()
        dataset = tablib.Dataset()

        imported_data = dataset.load(file.read())
        result = resource.import_data(imported_data, dry_run=True, collect_failed_rows = True)
        
        if not result.has_errors():
            return True, imported_data, result
        else:
            return False, imported_data, result
    except Exception as e:
        imported_data = None
        result = None
        return False, imported_data, result
 
def handle_uploaded_Annual_file(file):
    try:
        resource  = AnnualDataResource()
        dataset = tablib.Dataset()
        imported_data = dataset.load(file.read())

        data_set = []
        
        for item in imported_data.dict:
            for i,key in enumerate(item):
                if i != 0 and item['indicator'] != None:
                    data_set.append((
                        item['indicator'].strip(), #indicator key
                        key,  #year lists
                        item[key],  #performance
                        None, #target
                    ))
          

        data_set_table = tablib.Dataset(*data_set, headers=['indicator', 'for_datapoint', 'performance', 'target'])
        result = resource.import_data(data_set_table, dry_run=True)
        return True, data_set_table, result
    except Exception as e:
        return False, '', ''
    
def handle_uploaded_Quarter_file(file):
    try:
        resource  = QuarterDataResource()
        dataset = tablib.Dataset()
        imported_data = dataset.load(file.read())

        data_set = []
        
        for item in imported_data.dict:
            for i,key in enumerate(item):
                   if item['year'] != None and key != "year" and key != "quarter":
                       data_set.append((
                          key.strip() , #indicator 
                           item['quarter'], #Quarter number
                           item['year'], #Year
                           item[key], #Performance
                           None, #Target
                           ))

        data_set_table = tablib.Dataset(*data_set, headers=['indicator', 'for_quarter', 'for_datapoint', 'performance', 'target'])
        result = resource.import_data(data_set_table, dry_run=True)
        return True, data_set_table, result
    except Exception as e:
        return False, '', ''
    
def handle_uploaded_Month_file(file):
    try:
        resource  = MonthDataResource()
        dataset = tablib.Dataset()
        imported_data = dataset.load(file.read())

        data_set = []
        
        for item in imported_data.dict:
            for i,key in enumerate(item):
                   if item['year'] != None and key != "year" and key != "month":
                       data_set.append((
                           key.strip() , #indicator 
                           item['month'], #Month number
                           item['year'], #Year
                           item[key], #Performance
                           None, #Target
                           ))

        data_set_table = tablib.Dataset(*data_set, headers=['indicator', 'for_month', 'for_datapoint', 'performance', 'target'])
        result = resource.import_data(data_set_table, dry_run=True)
        return True, data_set_table, result
    except Exception as e:
        return False, '', ''
    

############# Handle uploaded excel files and take action ################
def confirm_file(imported_data, type):
    try:
        if type == 'topic':
            resource  = TopicResource()
        elif type == 'category':
            resource = CategoryResource()
        elif type == 'indicator':
            resource = IndicatorResource()
        elif type == 'yearly':
            resource = AnnualDataResource()
        elif type == 'quarterly':
            resource = QuarterDataResource()
        elif type == 'monthly':
            resource = MonthDataResource()
        result = resource.import_data(imported_data, dry_run=True, collect_failed_rows = True)
        
        if not result.has_errors():
            resource.import_data(imported_data, dry_run=False)  # Actually import now
            return True, f"Data imported successfully: {len(imported_data)} records imported."
        else:
            return False, f"Error importing data: Please review your Document."
    except Exception as e:
         return False, f"Error importing data: Please review your Document."
    




def create_aggregate_data_resource():
    YEARS = list(DataPoint.objects.order_by('year_EC').values_list('year_EC', flat=True).distinct())

    attrs = {
        'topic_name': fields.Field(column_name='Topic'),
        'category_name': fields.Field(column_name='Category'),
    }

    def dehydrate_topic_name(self, indicator):
        topics = set()
        for category in indicator.for_category.all():
            if category.topic:
                topics.add(category.topic.title_ENG)
        return ", ".join(sorted(topics)) if topics else ''
    attrs['dehydrate_topic_name'] = dehydrate_topic_name

    def dehydrate_category_name(self, indicator):
        categories = [cat.name_ENG for cat in indicator.for_category.all()]
        return ", ".join(categories) if categories else ''
    attrs['dehydrate_category_name'] = dehydrate_category_name

    def dehydrate_parent(self, indicator):
        return indicator.parent.code if indicator.parent else ''
    attrs['dehydrate_parent'] = dehydrate_parent

    def make_dehydrate_year(year):
        def f(self, indicator):
            annual_value = indicator.annual_data.filter(for_datapoint__year_EC=year).first()
            return annual_value.performance if annual_value else ''
        return f

    for year in YEARS:
        attrs[f'year_{year}'] = fields.Field(column_name=str(year))
        attrs[f'dehydrate_year_{year}'] = make_dehydrate_year(year)

    class Meta:
        model = Indicator
        fields = (
            'topic_name',
            'category_name',
            'title_ENG',
            'code',
            'description',
            'measurement_units',
            'frequency',
            'source',
            'methodology',
            'disaggregation_dimensions',
            'status',
            'version',
            'parent',
            'kpi_characteristics',
            *[f'year_{year}' for year in YEARS],
        )
        export_order = fields

    attrs['Meta'] = Meta
    return type('AnnualDataResource', (resources.ModelResource,), attrs)

AnnualDataResource = create_aggregate_data_resource()