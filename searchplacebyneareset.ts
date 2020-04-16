import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Platform, LoadingController } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { NativeGeocoder, NativeGeocoderResult } from '@ionic-native/native-geocoder/ngx';

declare var google: any;

@Component({
  selector: 'app-search-location',
  templateUrl: './search-location.page.html',
  styleUrls: ['./search-location.page.scss'],
})
export class SearchLocationPage implements OnInit {
  @ViewChild('map') mapElement: ElementRef;
  private map: any;
  private loading: any;
  public search: string = '';
  private googleAutoComplete = new google.maps.places.AutocompleteService();
  public searchResults = new Array<any>();
  private originMaker: any;
  public destination: any

  constructor(
    public geolocation: Geolocation,
    public plt: Platform,
    private loadingCtrl: LoadingController,
    private ngZone: NgZone,
    private nativeGeocoder: NativeGeocoder
    ) { }

  ngOnInit() {

    this.plt.ready().then(() => {
      this.initMap();
    });
  }

  async initMap() {
    this.loading = await this.loadingCtrl.create({ message: 'Please Wait...' });
    await this.loading.present();

    try {
      let position = await this.geolocation.getCurrentPosition()
      let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

      let mapOptions = {
        center: latLng,
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }
 
      this.map = await new google.maps.Map(this.mapElement.nativeElement, mapOptions);

      this.originMaker = await new google.maps.Marker({
        map: this.map,
        animation: google.maps.Animation.DROP,
        position: this.map.getCenter()
      });

      let content = "<h4>Information!</h4>";
      this.addInfoWindow(this.originMaker, content);

    } catch (error) {
      console.error(error)
    } finally {
      this.loading.dismiss();
    }
  }

  addInfoWindow(marker, content){
    let infoWindow = new google.maps.InfoWindow({
      content: content
    });

    google.maps.event.addListener(marker, 'click', () => {
      infoWindow.open(this.map, marker);
    });
  }

  searchChanged(){
    if (!this.search.trim().length) return;

    this.googleAutoComplete.getPlacePredictions({ input: this.search }, predictions => {
      this.ngZone.run(() => {
        this.searchResults = predictions;
      })
      // console.log(predictions)
    })
  }

  async searchPlace(item: any) {
    this.search = '';
    this.destination = item

    this.nativeGeocoder.forwardGeocode(this.destination.description)
    .then((result: NativeGeocoderResult[]) => this.moveMarker(result))
    .catch((error: any) => console.log(error));
  }

  async moveMarker(latLang: any) {
    let newPosition = await new google.maps.LatLng(parseFloat(latLang[0].latitude), parseFloat(latLang[0].longitude))
    await this.map.panTo(newPosition);

    if (this.originMaker && this.originMaker.setMap) {
      this.originMaker.setMap(null);
    }

    this.originMaker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: { lat: parseFloat(latLang[0].latitude), lng: parseFloat(latLang[0].longitude) }
    });
  }

}
