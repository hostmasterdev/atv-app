import {HttpClient} from '@angular/common/http';
import {Component, ViewChild, AfterViewInit} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';

/**
 * @title Table retrieving data through HTTP
 */
@Component({
  selector: 'app-root',
  styleUrls: ['app.component.scss'],
  templateUrl: 'app.component.html',
})
export class AppComponent implements AfterViewInit {
  displayedColumns: string[] = ['#','Updated By', 'Updated On', 'Entity Name', 'Entity ID', 'Type of Change', 'New Values', 'Old Values'];
  /**MAY NEED TO REMOVE ! FROM LINE BELOW: https://stackoverflow.com/questions/49699067/property-has-no-initializer-and-is-not-definitely-assigned-in-the-construc */
  atvDatabase: ATVDatabase | null;
  apiData: atvData[] = [];

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _httpClient: HttpClient) {}

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
    return entityArray
  }

  ngAfterViewInit() {
    this.atvDatabase = new ATVDatabase(this._httpClient);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));

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

          // Only refresh the result length if there is new data. In case of rate
          // limit errors, we do not want to reset the paginator to zero, as that
          // would prevent users from re-triggering requests.
          const dataArray = this.jsonParse(apiData)
          this.resultsLength = 60
         
          return dataArray;
        }),
      )
      
      .subscribe(data => (this.apiData = data));
      console.log(this.apiData);
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
  OldValues: {    
    PrimaryOrgId: string | null;
    PasswordExpiry: string | null,
    Password: string;
  }
}

/** An example database that the data source uses to retrieve data for the table. */
export class ATVDatabase {
  constructor(private _httpClient: HttpClient) {}

  getRepoIssues(sort: string, order: SortDirection, page: number): Observable<atvAPI> {

    const requestUrl = "https://run.mocky.io/v3/0d105fe2-0e98-47a6-af35-161b5972035f"
    console.log(requestUrl)

    return this._httpClient.get<atvAPI>(requestUrl);
  }
}


/**  Copyright 2023 Google LLC. All Rights Reserved.
    Use of this source code is governed by an MIT-style license that
    can be found in the LICENSE file at https://angular.io/license */

    
    