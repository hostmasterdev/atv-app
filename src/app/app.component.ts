import {HttpClient} from '@angular/common/http';
import {Component, ViewChild, AfterViewInit} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import * as Papa from 'papaparse';
import { MatTableDataSource } from '@angular/material/table';
import { MatTable } from '@angular/material/table';




/**
 * @title Table retrieving data through HTTP
 */
@Component({
  selector: 'app-root',
  styleUrls: ['app.component.scss'],
  templateUrl: 'app.component.html',
})

export class AppComponent implements AfterViewInit {
  displayedColumns: string[] = ['#','Updated By', 'Updated On', 'Entity Name', 'Entity ID', 'Type of Change', 'Old Values', 'New Values',];
  dataSource = new MatTableDataSource<atvData>;
  applyFilter(event: Event, column: string, oldColumn: string, newColumn: string) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.dataSource.filterPredicate = (data, filter) => {
      const accumulator = (currentTerm: any, key: any) => {
        return key === column ? currentTerm + data[key] :
          key === oldColumn ? currentTerm + JSON.stringify(data.OldValues).toLowerCase() :
          key === newColumn ? currentTerm + JSON.stringify(data.NewValues).toLowerCase() :
          key === oldColumn ? currentTerm + JSON.stringify(data[oldColumn]).toLowerCase() :
          key === 'UpdatedTimestamp' ? currentTerm + data['UpdatedTimestamp'].toLowerCase() :
          key === 'EntityName' ? currentTerm + data['EntityName'].toLowerCase() :
          key === 'UserID' ? currentTerm + data['UserID'].toLowerCase() :
          key === 'TypeOfChange' ? currentTerm + data['TypeOfChange'].toLowerCase() :
          key === 'Old Values' ? currentTerm + JSON.stringify(data['Old Values']).toLowerCase() :
          key === 'New Values' ? currentTerm + JSON.stringify(data['New Values']).toLowerCase() :
          key === 'UpdatedBy' ? currentTerm + JSON.stringify(data['UpdatedBy']).toLowerCase() :
          currentTerm;
      };
      const dataStr = Object.keys(data).reduce(accumulator, '').toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };
  }
  constructor(private _httpClient: HttpClient, private _sanitizer: DomSanitizer, private _iconRegistry: MatIconRegistry) {
  }  
  
// CSV File Download


exportToCSV(): void {
  const headers = ["UserID", "EntityName", "TypeOfChange", "UpdatedTimestamp", "UpdatedBy", "OldValues", "NewValues"];
  const dataToExport = this.dataSource.filteredData.map(row => {
    const { UserID, EntityName, TypeOfChange, UpdatedTimestamp, UpdatedBy, OldValues, PrimaryOrgId, PasswordExpiry, Password } = row;
    const oldValues = OldValues ? JSON.stringify(OldValues) : '';
    const newValues = JSON.stringify({PrimaryOrgId, PasswordExpiry, Password});
    return [UserID, EntityName, TypeOfChange, UpdatedTimestamp, UpdatedBy, oldValues, newValues];
  });

  const filename = "audit_trail.csv";
  const csv = Papa.unparse({
    fields: headers,
    data: dataToExport,
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}


 // XML File Download

 exportToXML(): void {
  const dataToExport = this.dataSource.filteredData.map(row => {
    const { UserID, EntityName, TypeOfChange, UpdatedTimestamp, UpdatedBy, OldValues, PrimaryOrgId, PasswordExpiry, Password } = row;
    const oldValues = OldValues ? { PrimaryOrgId, PasswordExpiry, Password } : null;
    const newValues = { PrimaryOrgId: row.PrimaryOrgId, PasswordExpiry: row.PasswordExpiry, Password: row.Password };
    return {
      UserID,
      EntityName,
      TypeOfChange,
      UpdatedTimestamp,
      UpdatedBy,
      OldValues: oldValues,
      NewValues: newValues
    };
  });

  const xml = this.convertToXML(dataToExport);
  const link = document.createElement('a');
  link.download = 'audit_trail.xml';
  link.href = 'data:text/xml;charset=utf-8,' + encodeURIComponent(xml);
  link.click();
}

convertToXML(data: any): string {
  const root = document.createElement('audit_trail');
  for (const row of data) {
    const node = document.createElement('row');
    for (const [key, value] of Object.entries(row as { [key: string]: any })) {
      if (key === 'OldValues' && value !== null) {
        const oldValuesNode = document.createElement('OldValues');
        for (const [oldKey, oldValue] of Object.entries(value as { [key: string]: any })) {
          const oldNode = document.createElement(oldKey);
          const textNode = document.createTextNode(oldValue);
          oldNode.appendChild(textNode);
          oldValuesNode.appendChild(oldNode);
        }
        node.appendChild(oldValuesNode);
      } else if (key === 'NewValues') {
        const newValuesNode = document.createElement('NewValues');
        for (const [newKey, newValue] of Object.entries(value as { [key: string]: any })) {
          const newNode = document.createElement(newKey);
          const textNode = document.createTextNode(newValue);
          newNode.appendChild(textNode);
          newValuesNode.appendChild(newNode);
        }
        node.appendChild(newValuesNode);
      } else if (key === 'PrimaryOrgId' || key === 'PasswordExpiry') {
        const childNode = document.createElement(key);
        const textNode = document.createTextNode(value);
        childNode.appendChild(textNode);
        node.appendChild(childNode);
      } else {
        // do nothing for other fields
      }
    }
    root.appendChild(node);
  }
  const serializer = new XMLSerializer();
  let xml = serializer.serializeToString(root);
  xml = xml.replace(/(>)\s*(<)(\/*)/g, '$1\n$2$3');
  return xml;
}

  
// JSON File Download 
exportToJSON() {
  const filteredData = this.dataSource.filteredData;
  const dataToExport = filteredData.map(row => {
    const { UserID, EntityName, TypeOfChange, UpdatedTimestamp, UpdatedBy, OldValues, PrimaryOrgId, PasswordExpiry, Password } = row;
    const oldValues = OldValues ? { PrimaryOrgId, PasswordExpiry, Password } : null;
    const newValues = { PrimaryOrgId: row.PrimaryOrgId, PasswordExpiry: row.PasswordExpiry, Password: row.Password };
    return {
      UserID,
      EntityName,
      TypeOfChange,
      UpdatedTimestamp,
      UpdatedBy,
      OldValues: oldValues,
      NewValues: newValues
    };
  });

  const filename = "audit_trail.json";
  const contentType = "application/json;charset=utf-8;";
  const a = document.createElement("a");
  const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: contentType });
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}


  atvDatabase: ATVDatabase | null;
  apiData: atvData[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatTable) table: MatTable<any>;

  private jsonParse(apiData: atvAPI): Array<atvData> {
    const dataArray = apiData["data"]
    let entityArray = []
    
     for (let index in dataArray) {
        const obj = dataArray[index]

        if (!!obj["AuditMetaData"] && obj["AuditMetaData"]["EntityName"] === "User") {
            if (obj["TypeOfChange"] === "UPDATE" || obj["TypeOfChange"] === "ADD") {

                const auditObj = {
                    "UpdatedBy": obj["EntityPayload"]["UpdatedBy"] || null,
                    "UpdatedTimestamp": obj["EntityPayload"]["UpdatedTimestamp"] || null,
                    "EntityName": obj["AuditMetaData"]["EntityName"] || null,
                    "UserID": obj["BussinessKeyPayload"]["UserId"] || null,
                    "TypeOfChange": obj["TypeOfChange"] || null,
                    "PrimaryOrgId": obj["EntityPayload"]["PrimaryOrgId"] || null,
                    "PasswordExpiry": obj["EntityPayload"]["PasswordExpiry"] || null,
                    "Password": obj["EntityPayload"]["Password"] || null
                }
                if (obj["TypeOfChange"] === "UPDATE") {
                    auditObj["OldValues"] = obj["EntityPayload"]["OldValues"] || null
                }
                entityArray.push(auditObj)
            }
        }

    }
    entityArray.sort((a, b) => a.UserID < b.UserID ? -1 : a.UserID > b.UserID ? 1 : 0)
    return entityArray

 
  }
  ngAfterViewInit() {
    this.atvDatabase = new ATVDatabase(this._httpClient);
  
    this._iconRegistry.addSvgIcon(
      'download',
      this._sanitizer.bypassSecurityTrustResourceUrl('/assets/icons/download.svg')
    );
  
    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));
  
    // Create a new MatTableDataSource object and set it as the dataSource for your table
    this.dataSource = new MatTableDataSource();
    this.table.dataSource = this.dataSource;
  
    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.atvDatabase!.getRepoIssues(
            this.sort.active,
            this.sort.direction,
            this.paginator.pageIndex,
          ).pipe(catchError(() => observableOf(null)));
        }),
        map(apiData => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = apiData === null;
  
          if (apiData === null) {
            return [];
          }
  
          // Parse the JSON response and update the results length
          const dataArray = this.jsonParse(apiData);
          this.resultsLength = dataArray.length;
  
          // Return the data as an array
          return dataArray;
        }),
      )
      .subscribe(data => {
        // Set the data for the MatTableDataSource object
        this.dataSource.data = data;
      });
  }
  
  
}
export interface atvAPI {
  data: atvData[];
}
export interface atvData {
  UpdatedBy: string;
  UpdatedTimestamp: string;
  EntityName: string;
  UserID: string;
  TypeOfChange: string;
  PrimaryOrgId: string | null;
  PasswordExpiry: string | null,
  Password: string;
  NewValues: any;
  OldValues: any
}
export class ATVDatabase {
  constructor(private _httpClient: HttpClient) {}

  getRepoIssues(_sort: string, _order: SortDirection, _page: number): Observable<atvAPI> {

    const requestUrl = "https://run.mocky.io/v3/0d105fe2-0e98-47a6-af35-161b5972035f"
    console.log(requestUrl)

    return this._httpClient.get<atvAPI>(requestUrl);
  }
}
 
    